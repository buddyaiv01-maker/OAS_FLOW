// legacy_UI's sidebar has a "Settings" nav item that was never wired to a real panel either —
// this is a real placeholder view (not the canvas leaking through), pending actual settings.
export default function SettingsView() {
  return (
    <div className="dashboard-view">
      <div className="dashboard-head">
        <div>
          <h2>Settings</h2>
          <p>App-level preferences.</p>
        </div>
      </div>
      <p className="addnode-popup-empty">Nothing here yet.</p>
    </div>
  );
}
