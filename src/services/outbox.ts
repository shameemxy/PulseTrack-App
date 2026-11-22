import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { isBackendConfigured } from '../config/env';
import { writeIncident, resolveIncidentRemote, type IncidentWriteJob } from './supabase';

/**
 * Durable offline outbox. Every emergency write is stored in AsyncStorage
 * BEFORE the first network attempt, so a crash, a dead connection or an app
 * kill never loses the alert. Writes are idempotent (client-generated ids,
 * unique violations treated as success), so retries cannot duplicate rows.
 *
 * Note on the family link token: the raw token lives in the SMS body, and only
 * its hash is queued here, so the outbox holds no usable secret.
 */

const OUTBOX_KEY = 'pulsetrack.outbox.v1';
const MAX_ATTEMPTS = 12;
const MIN_RETRY_GAP_MS = 5_000;

export type OutboxEntry =
  | { type: 'incident'; id: string; job: IncidentWriteJob; attempts: number; lastAttemptAt: number; enqueuedAt: number }
  | { type: 'resolve'; id: string; incidentId: string; attempts: number; lastAttemptAt: number; enqueuedAt: number };

export type OutboxListener = (event: { type: 'sent' | 'failed' | 'blocked'; entry: OutboxEntry; message?: string }) => void;

const listeners = new Set<OutboxListener>();
export function subscribeOutbox(listener: OutboxListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit(event: Parameters<OutboxListener>[0]) {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* a listener must never break the flush loop */
    }
  });
}

// Serialize all read-modify-write cycles on the stored queue.
let queueLock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = queueLock.then(fn, fn);
  queueLock = next.catch(() => undefined);
  return next;
}

async function readQueue(): Promise<OutboxEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: OutboxEntry[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

export function enqueueIncident(job: IncidentWriteJob): Promise<void> {
  return withLock(async () => {
    const queue = await readQueue();
    if (queue.some((e) => e.type === 'incident' && e.id === job.incidentId)) return;
    queue.push({
      type: 'incident',
      id: job.incidentId,
      job,
      attempts: 0,
      lastAttemptAt: 0,
      enqueuedAt: Date.now(),
    });
    await writeQueue(queue);
  });
}

export function enqueueResolve(incidentId: string): Promise<void> {
  return withLock(async () => {
    const queue = await readQueue();
    const id = `resolve:${incidentId}`;
    if (queue.some((e) => e.id === id)) return;
    queue.push({
      type: 'resolve',
      id,
      incidentId,
      attempts: 0,
      lastAttemptAt: 0,
      enqueuedAt: Date.now(),
    });
    await writeQueue(queue);
  });
}

let flushing = false;

/**
 * Attempts every queued entry once. Incidents always go before resolves so a
 * resolve can never race ahead of its own incident row.
 * @param force ignore the per-entry retry gap (used right after enqueue)
 */
export async function flushOutbox(force = false): Promise<{ sent: number; remaining: number }> {
  if (flushing || !isBackendConfigured) {
    return { sent: 0, remaining: await getPendingCount() };
  }
  flushing = true;
  let sent = 0;
  try {
    const snapshot = await withLock(readQueue);
    const ordered = [...snapshot].sort((a, b) => (a.type === b.type ? a.enqueuedAt - b.enqueuedAt : a.type === 'incident' ? -1 : 1));

    for (const entry of ordered) {
      if (!force && Date.now() - entry.lastAttemptAt < MIN_RETRY_GAP_MS) continue;

      const result =
        entry.type === 'incident'
          ? await writeIncident(entry.job)
          : await resolveIncidentRemote(entry.incidentId);

      await withLock(async () => {
        const queue = await readQueue();
        const idx = queue.findIndex((e) => e.id === entry.id);
        if (idx === -1) return;

        if (result.kind === 'ok') {
          queue.splice(idx, 1);
          sent += 1;
          emit({ type: 'sent', entry });
        } else if (result.kind === 'permanent') {
          // Do not retry rows the server will never accept; surface it instead.
          queue.splice(idx, 1);
          emit({ type: 'failed', entry, message: result.message });
        } else if (result.kind === 'blocked') {
          emit({ type: 'blocked', entry, message: result.message });
        } else {
          const attempts = queue[idx].attempts + 1;
          if (attempts >= MAX_ATTEMPTS) {
            // Keep the entry (an SOS must not be silently dropped), but stop
            // hammering: it retries again on the next foreground/connectivity event.
            queue[idx] = { ...queue[idx], attempts: MAX_ATTEMPTS - 1, lastAttemptAt: Date.now() };
          } else {
            queue[idx] = { ...queue[idx], attempts, lastAttemptAt: Date.now() };
          }
        }
        await writeQueue(queue);
      });
    }
  } finally {
    flushing = false;
  }
  return { sent, remaining: await getPendingCount() };
}

let started = false;

/** Call once at app start. Retries when connectivity returns and on foreground. */
export function startOutboxWatcher(): () => void {
  if (started) return () => undefined;
  started = true;

  const netUnsub = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void flushOutbox();
    }
  });
  const appSub = AppState.addEventListener('change', (s) => {
    if (s === 'active') void flushOutbox();
  });
  const interval = setInterval(() => {
    void flushOutbox();
  }, 30_000);

  void flushOutbox();

  return () => {
    started = false;
    netUnsub();
    appSub.remove();
    clearInterval(interval);
  };
}
