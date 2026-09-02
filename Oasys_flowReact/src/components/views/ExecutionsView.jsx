// Stub port of legacy_UI's #executionsView — the run history list from Phase 3, click-through
// to per-node input/output.
export default function ExecutionsView() {
  return (
    <div className="dashboard-view">
      <div className="dashboard-head">
        <div>
          <h2>Executions</h2>
          <p>Every run of every workflow, most recent first.</p>
        </div>
      </div>
      <p className="addnode-popup-empty">No runs yet — the execution engine isn't wired up in the React app yet (in progress).</p>
    </div>
  );
}
