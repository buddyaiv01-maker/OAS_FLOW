import { useState } from "react";
import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";

const FUNCTIONS = [
  { fn: "upper", label: "UPPER", title: "Uppercase" },
  { fn: "lower", label: "lower", title: "Lowercase" },
  { fn: "trim", label: "Trim", title: "Trim whitespace" },
  { fn: "default", label: "Default", title: "Fallback if empty" },
];

// Port of legacy_UI's #fieldPicker — search + transform-function strip + fields grouped by
// upstream node, colored to match that node's badge color.
export default function FieldPicker({ upstream, onPick, onFunction, style }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = new Map();
  upstream.forEach((o) => {
    if (q && !o.fieldLabel.toLowerCase().includes(q) && !o.nodeName.toLowerCase().includes(q)) return;
    if (!groups.has(o.nodeId)) {
      const meta = nodeTypeLibrary[o.type] || {};
      groups.set(o.nodeId, { nodeName: o.nodeName, color: o.color, fields: [] });
    }
    groups.get(o.nodeId).fields.push(o);
  });

  return (
    <div className="field-picker is-open" style={style} onMouseDown={(e) => e.stopPropagation()}>
      <div className="field-picker-search">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        <input type="text" placeholder="Search fields…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      </div>
      <div className="field-picker-functions">
        <span className="field-picker-functions-label">ƒ</span>
        {FUNCTIONS.map((f) => (
          <button key={f.fn} type="button" title={f.title} onClick={() => onFunction(f.fn)}>{f.label}</button>
        ))}
      </div>
      <div className="field-picker-list">
        {upstream.length === 0 && (
          <p className="field-picker-empty">No earlier steps produce mappable fields yet — connect a trigger like Chat Interface or Webhook upstream.</p>
        )}
        {upstream.length > 0 && groups.size === 0 && (
          <p className="field-picker-empty">No fields match "{query}".</p>
        )}
        {Array.from(groups.values()).map((g) => (
          <div key={g.nodeName} className="field-picker-group">
            <div className="field-picker-group-head"><span className="field-picker-dot" style={{ background: g.color }} />{g.nodeName}</div>
            <div className="field-picker-chips">
              {g.fields.map((f) => (
                <button
                  key={f.fieldKey}
                  type="button"
                  className="field-picker-chip"
                  style={{ background: g.color }}
                  onClick={() => onPick(`{{${f.nodeName}.${f.fieldKey}}}`)}
                >
                  {f.fieldLabel}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
