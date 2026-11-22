import * as Crypto from 'expo-crypto';
import { buildFamilyAlertLink } from '../config/env';
import type { FamilyLinkInsert } from './supabase';

const TOKEN_BYTES = 32;
const LINK_TTL_MS = 72 * 60 * 60 * 1000; // matches the 72 h retention window

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

export interface FamilyAccess {
  contactId: string;
  /** Link to send to this contact. Contains the raw token; never stored remotely. */
  link: string | null;
  /** Row to insert into public.family_links (hash only). */
  linkRow: FamilyLinkInsert;
}

/**
 * Creates one independent 32-byte token per contact so a single link can be
 * revoked without affecting the others. Only the sha256 hex of the token is
 * sent to Supabase; get_family_alert() hashes the presented token the same way
 * (sha256 over the 64-character hex string as UTF-8 text).
 */
export async function createFamilyAccess(
  incidentId: string,
  contactIds: string[]
): Promise<FamilyAccess[]> {
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString();
  const results: FamilyAccess[] = [];

  for (const contactId of contactIds) {
    const token = bytesToHex(Crypto.getRandomBytes(TOKEN_BYTES));
    const tokenHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
    results.push({
      contactId,
      link: buildFamilyAlertLink(incidentId, token),
      linkRow: {
        id: Crypto.randomUUID(),
        token_hash: tokenHash.toLowerCase(),
        expires_at: expiresAt,
      },
    });
  }
  return results;
}
