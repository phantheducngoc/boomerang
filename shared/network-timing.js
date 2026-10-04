// Client input and authoritative simulation share a cadence; no position prediction.
export const NETWORK_TICK_RATE = 60;
export const NETWORK_TICK_SECONDS = 1 / NETWORK_TICK_RATE;

export function snapshotDelay(jitter = 0) {
  // Two snapshots cover normal arrival variation without an extra 67ms baseline.
  return Math.min(100, 2000 / NETWORK_TICK_RATE + Math.max(0, jitter) * 2);
}
