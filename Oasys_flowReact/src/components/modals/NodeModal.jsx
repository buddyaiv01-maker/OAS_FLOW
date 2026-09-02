import { useState } from "react";
import { useWorkflow } from "../../state/WorkflowContext.jsx";
import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";

const TABS = [
  { key: "params", label: "Parameters" },
  { key: "settings", label: "Settings" },
  { key: "notes", label: "Notes" },
];

function ParamField({ node, param, updateNodeParam }) {
  const state = node.params[param.key] || { value: param.default || "" };
  const onChange = (e) => updateNodeParam(node.id, param.key, e.target.value);

  return (
    <label className="field param-field">
      <div className="param-field-head">
        <span>{param.label}{param.required ? <span className="req">*</span> : null}</span>
      </div>
      {param.type === "textarea" ? (
        <textarea className="param-input" rows={2} value={state.value || ""} placeholder={param.placeholder || ""} onChange={onChange} />
      ) : param.type === "select" ? (
        <select className="param-input" value={state.value || param.default || ""} onChange={onChange}>
          {(param.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" className="param-input" value={state.value || ""} placeholder={param.placeholder || ""} onChange={onChange} />
      )}
    </label>
  );
}

// Port target for legacy_UI/app.js's #nodeModalOverlay. Params render and save for real; field
// mapping/expressions (the Map toggle + field picker) is Phase 1 scope, not built here yet.
// Settings/Notes tabs are inert placeholders, matching where the vanilla app was before Phase 2.
export default function NodeModal() {
  const { nodesById, selectedNodeId, setSelectedNodeId, renameNode, updateNodeDesc, updateNodeParam, deleteNode } = useWorkflow();
  const [tab, setTab] = useState("params");
  const node = selectedNodeId ? nodesById[selectedNodeId] : null;

  if (!node) return null;
  const meta = nodeTypeLibrary[node.type];
  if (!meta) return null;

  function close() {
    setTab("params");
    setSelectedNodeId(null);
  }

  return (
    <div className="modal-overlay is-open" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="node-modal">
        <header className="node-modal-head">
          <div className={"node-badge lg " + meta.badge}>
            <svg viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: meta.icon }} />
          </div>
          <div className="node-modal-title-wrap">
            <h2
              className="node-modal-title"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={(e) => renameNode(node.id, e.target.textContent)}
            >
              {node.sub}
            </h2>
            <span className="node-modal-sub">{meta.label}</span>
          </div>
          <div className="node-modal-head-actions">
            <button className="icon-btn" title="Close" onClick={close}>
              <svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        </header>

        <div className="node-modal-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"node-modal-tab" + (tab === t.key ? " is-active" : "")} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="node-modal-body">
          {tab === "params" && (
            <div className="node-modal-panel">
              {(meta.params || []).map((p) => (
                <ParamField key={p.key} node={node} param={p} updateNodeParam={updateNodeParam} />
              ))}
              <label className="field">
                <span>Description</span>
                <textarea rows={2} value={node.desc} onChange={(e) => updateNodeDesc(node.id, e.target.value)} />
              </label>
            </div>
          )}
          {tab === "settings" && (
            <div className="node-modal-panel">
              <p className="addnode-popup-empty">Retry/On-Error settings — not ported yet.</p>
            </div>
          )}
          {tab === "notes" && (
            <div className="node-modal-panel">
              <label className="field">
                <span>Node notes</span>
                <textarea rows={5} placeholder="Add a note about what this node does…" />
              </label>
            </div>
          )}
        </div>

        <footer className="node-modal-foot">
          <button className="delete-node-btn" onClick={() => { deleteNode(node.id); close(); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Delete Node
          </button>
          <button className="save-btn" onClick={close}>Done</button>
        </footer>
      </div>
    </div>
  );
}
