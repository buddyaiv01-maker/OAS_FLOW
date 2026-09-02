// Stub port of legacy_UI/index.html's #dashboardView — workflow cards, stats, "New Workflow".
export default function DashboardView() {
  return (
    <div className="dashboard-view">
      <div className="dashboard-head">
        <div>
          <h2>Dashboard</h2>
          <p>Every workflow in your workspace, at a glance.</p>
        </div>
      </div>
      <div className="dashboard-grid" />
    </div>
  );
}
