// Stub port of legacy_UI's #templatesView — the Phase 5 template gallery ("Use Template" clones
// a starter workflow via the import path).
export default function TemplatesView() {
  return (
    <div className="dashboard-view">
      <div className="dashboard-head">
        <div>
          <h2>Templates</h2>
          <p>Starter workflows — clone one to get going in seconds.</p>
        </div>
      </div>
      <div className="dashboard-grid" />
    </div>
  );
}
