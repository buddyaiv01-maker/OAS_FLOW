import { useWorkflow } from "../../state/WorkflowContext.jsx";

// Port of legacy_UI's #dashboardView — real workflow cards + stats, wired to WorkflowContext.
export default function DashboardView({ onOpenWorkflow }) {
  const { workflows, createWorkflow, deleteWorkflow, nodeCountFor } = useWorkflow();

  function open(id) {
    onOpenWorkflow(id);
  }

  return (
    <div className="dashboard-view">
      <div className="dashboard-head">
        <div>
          <h2>Dashboard</h2>
          <p>Every workflow in your workspace, at a glance.</p>
        </div>
        <button className="btn-new-workflow dashboard-new-btn" onClick={() => { createWorkflow(); onOpenWorkflow(); }}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          <span>New Workflow</span>
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span className="dashboard-stat-num">{workflows.length}</span>
          <span className="dashboard-stat-label">Workflows</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-num">{workflows.filter((w) => w.status === "active").length}</span>
          <span className="dashboard-stat-label">Active</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-num">{workflows.filter((w) => w.status !== "active").length}</span>
          <span className="dashboard-stat-label">Draft</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {workflows.map((wf) => {
          const statusClass = wf.status === "active" ? "status-active" : "status-draft";
          const statusLabel = wf.status === "active" ? "Active" : "Draft";
          const nodeCount = nodeCountFor(wf.id);
          return (
            <div key={wf.id} className="dashboard-card" role="button" tabIndex={0} onClick={() => open(wf.id)}>
              <button
                className="dashboard-card-delete"
                title="Delete workflow"
                onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }}
              >
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="dashboard-card-head">
                <span className="dashboard-card-icon" style={{ background: "linear-gradient(135deg, var(--orange), #ffb347)" }}>
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" /><circle cx="18" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" /><path d="M8.1 7.1 10.5 16M15.9 7.1 13.5 16M8.4 6h7.2" stroke="currentColor" strokeWidth="1.6" /></svg>
                </span>
                <span className="dashboard-card-title">{wf.name}</span>
              </div>
              <span className={"dashboard-card-status " + statusClass}><span className="dot" />{statusLabel}</span>
              <span className="dashboard-card-meta">{nodeCount} node{nodeCount === 1 ? "" : "s"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
