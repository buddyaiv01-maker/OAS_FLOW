import { useState } from "react";
import { useWorkflow } from "../../state/WorkflowContext.jsx";

// Port of legacy_UI's #executionsView + #executionDetailOverlay — real run history (§9), backed
// by executeWorkflow()'s records in WorkflowContext, with click-through to per-node input/output.
export default function ExecutionsView() {
  const { executionRuns } = useWorkflow();
  const [selectedRun, setSelectedRun] = useState(null);

  return (
    <div className="dashboard-view">
      <div className="dashboard-head">
        <div>
          <h2>Executions</h2>
          <p>Every run of every workflow, most recent first.</p>
        </div>
      </div>

      {executionRuns.length === 0 ? (
        <p className="addnode-popup-empty">No runs yet — hit <strong>Execute</strong> on a workflow to see it here.</p>
      ) : (
        <div className="dashboard-grid">
          {executionRuns.map((run) => (
            <div key={run.id} className="dashboard-card" role="button" tabIndex={0} onClick={() => setSelectedRun(run)}>
              <div className="dashboard-card-head">
                <span className="dashboard-card-icon" style={{ background: "linear-gradient(135deg, var(--orange), #ffb347)" }}>
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </span>
                <span className="dashboard-card-title">{run.workflowName}</span>
              </div>
              <span className={"dashboard-card-status " + (run.status === "success" ? "status-active" : "status-error")}>
                <span className="dot" />{run.status === "success" ? "Success" : "Error"}
              </span>
              <span className="dashboard-card-meta">{run.nodeCount} node{run.nodeCount === 1 ? "" : "s"} · {new Date(run.startedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {selectedRun && (
        <div className="modal-overlay is-open" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedRun(null); }}>
          <div className="node-modal">
            <header className="node-modal-head">
              <div className="node-modal-title-wrap">
                <h2 className="node-modal-title">{selectedRun.workflowName}</h2>
                <span className="node-modal-sub">{new Date(selectedRun.startedAt).toLocaleString()} · {selectedRun.nodeCount} node{selectedRun.nodeCount === 1 ? "" : "s"}</span>
              </div>
              <div className="node-modal-head-actions">
                <button className="icon-btn" title="Close" onClick={() => setSelectedRun(null)}>
                  <svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </button>
              </div>
            </header>
            <div className="node-modal-body">
              <div className="node-modal-panel">
                {selectedRun.nodeResults.map((nr) => (
                  <div key={nr.id} className="exec-node-row">
                    <div className="exec-node-row-head">
                      <span className={"node-badge " + nr.badge} />
                      <span className="exec-node-row-name">{nr.label}</span>
                    </div>
                    <pre>{JSON.stringify(nr.output, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
