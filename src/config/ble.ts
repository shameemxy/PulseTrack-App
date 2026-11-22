/**
 * PulseTrack BLE identifiers.
 *
 * The previous service UUID 0xFD6F belongs to the Bluetooth SIG-assigned
 * COVID-19 Exposure Notification service, so other apps and OS components may
 * advertise or scan it. PulseTrack uses its own random 128-bit UUID instead.
 *
 * Do not change these values after devices are deployed: peers match on them.
 *
 * Platform boundary (declared, not hidden): react-native-ble-plx implements the
 * central (scanning/connecting) role only. Advertising this service from a
 * phone needs a separate peripheral-capable native module in a custom build;
 * that choice is made in Phase 2. Until then advertising is reported as
 * "unavailable", never as success.
 */
export const PULSETRACK_BLE_SERVICE_UUID = '80E47C9C-99FF-404E-B689-99C6D3219139';

/** Characteristic carrying the compact SOS payload. */
export const PULSETRACK_BLE_SOS_CHAR_UUID = '80E47C9D-99FF-404E-B689-99C6D3219139';
