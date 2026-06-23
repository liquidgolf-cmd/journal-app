const API_KEY_KEY = "keep_granola_api_key";
const LAST_SYNC_KEY = "keep_granola_last_sync";

export function getGranolaApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(API_KEY_KEY) || "";
}

export function setGranolaApiKey(key: string) {
  window.localStorage.setItem(API_KEY_KEY, key.trim());
}

export function clearGranolaApiKey() {
  window.localStorage.removeItem(API_KEY_KEY);
}

export function getGranolaLastSync(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SYNC_KEY);
}

export function setGranolaLastSync(iso: string) {
  window.localStorage.setItem(LAST_SYNC_KEY, iso);
}

export function defaultGranolaSince(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

export function nextGranolaSince(): string {
  return getGranolaLastSync() || defaultGranolaSince();
}
