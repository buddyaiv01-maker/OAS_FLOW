import { useState } from "react";
import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";

// Port of legacy_UI/app.js's #addNodePopup — search box + a list of node types to drop on canvas.
export default function AddNodePopup({ onPick }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const entries = Object.entries(nodeTypeLibrary).filter(([, meta]) => !q || meta.label.toLowerCase().includes(q));

  return (
    <div className="addnode-popup is-open" onMouseDown={(e) => e.stopPropagation()}>
      <div className="addnode-popup-search">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        <input
          type="text"
          placeholder="Search node types…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="addnode-popup-label">All Nodes</div>
      <div className="addnode-popup-list">
        {entries.length === 0 && <p className="addnode-popup-empty">No node types match "{query}".</p>}
        {entries.map(([type, meta]) => (
          <div key={type} className="addnode-popup-row" onClick={() => onPick(type)}>
            <span className={"node-badge " + meta.badge}>
              <svg viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: meta.icon }} />
            </span>
            <span className="addnode-popup-row-label">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
