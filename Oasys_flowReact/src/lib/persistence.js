// Same localStorage-blob approach as legacy_UI/app.js's persistence layer, just under its own
// key — this app runs on a different origin (port 5174) so there's no collision risk with the
// legacy app's "oasysflow-state-v1", but a distinct name keeps intent obvious either way.
const STORAGE_KEY = "oasysflow-react-state-v1";

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state && Array.isArray(state.workflows) ? state : null;
  } catch (e) {
    return null;
  }
}

export function savePersistedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* storage full or unavailable — nothing more we can do client-side */
  }
}
