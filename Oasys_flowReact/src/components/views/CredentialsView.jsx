import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";

const KIND_LABELS = {
  oauth: "OAuth",
  apikey: "API Key",
  form: "Connection Form",
  ollama: "Local Server",
};

// Real listing of every node type that needs a connection (from nodeTypeLibrary), grouped by
// auth kind. The full credential manager (save/test/delete aliases, per-node scoping) from
// legacy_UI/app.js's renderConnectionBlock() is a later port — this is an honest interim view,
// not a dead tab.
export default function CredentialsView() {
  const entries = Object.entries(nodeTypeLibrary).filter(([, meta]) => meta.connection);

  return (
    <div className="credentials-view">
      <div className="dashboard-head">
        <div>
          <h2>Credentials</h2>
          <p>Every connection your nodes can use, in one place.</p>
        </div>
      </div>
      <p className="addnode-popup-empty" style={{ marginBottom: 16 }}>
        Saving and managing credential aliases isn't ported to React yet — this lists what each
        integration needs so you know what's coming.
      </p>
      <div className="dashboard-grid">
        {entries.map(([type, meta]) => (
          <div key={type} className="dashboard-card">
            <div className="dashboard-card-head">
              <span className={"node-badge " + meta.badge}>
                <svg viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: meta.icon }} />
              </span>
              <span className="dashboard-card-title">{meta.label}</span>
            </div>
            <span className="dashboard-card-meta">{KIND_LABELS[meta.connection.kind] || meta.connection.kind}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
