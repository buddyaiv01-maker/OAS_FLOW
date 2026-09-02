// Port target for legacy_UI/app.js's persistence layer: STORAGE_KEY, persist(), schedulePersist(),
// loadPersistedState(). Same localStorage-blob approach works unchanged in React — persist() just
// needs to read from React state (context/store) instead of the DOM/global closures.
export const STORAGE_KEY = "oasysflow-state-v1";

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
