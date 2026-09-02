import { useRef, useState } from "react";
import { useWorkflow } from "../../state/WorkflowContext.jsx";
import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";
import { evaluateExpressionPreview } from "../../lib/expressionEngine.js";
import FieldPicker from "./FieldPicker.jsx";

const TABS = [
  { key: "params", label: "Parameters" },
  { key: "settings", label: "Settings" },
  { key: "notes", label: "Notes" },
];

function ParamField({ node, param, upstream, updateNodeParam, setParamMapped, onOpenPicker }) {
  const state = node.params[param.key] || { value: param.default || "", mapped: false };
  const onChange = (e) => updateNodeParam(node.id, param.key, e.target.value);
  const insertBtnRef = useRef(null);

  return (
    <label className={"field param-field" + (state.mapped ? " is-mapped" : "")}>
      <div className="param-field-head">
        <span>{param.label}{param.required ? <span className="req">*</span> : null}</span>
        {param.mappable && (
          <div className="param-map-row">
            <button
              type="button"
              className={"param-map-toggle" + (state.mapped ? " is-on" : "")}
              onClick={() => setParamMapped(node.id, param.key, !state.mapped)}
            >
              <span className="knob" />
            </button>
            <span className="param-map-label">Map</span>
          </div>
        )}
      </div>

      {state.mapped ? (
        <>
          <div className="param-mapped-wrap">
            <input
              type="text"
              className="param-input param-mapped-input"
              placeholder="Enter text or click a field to insert…"
              value={state.value || ""}
              onChange={onChange}
            />
            <button
              type="button"
              ref={insertBtnRef}
              className="param-mapped-insert-btn"
              title="Insert a field from an earlier step"
              onClick={() => onOpenPicker(param.key, insertBtnRef.current)}
            >
              <svg viewBox="0 0 24 24" fill="none"><path d="M8 4a3 3 0 0 0-3 3v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a3 3 0 0 0 3 3M16 4a3 3 0 0 1 3 3v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <p className="param-preview">Preview: <span>{evaluateExpressionPreview(state.value, upstream) || "—"}</span></p>
        </>
      ) : param.type === "textarea" ? (
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

// Port target for legacy_UI/app.js's #nodeModalOverlay, now with real field mapping (§3): the Map
// toggle, field picker (grouped by upstream node, ƒ transform chips), and a live evaluated preview.
// Settings/Notes tabs are still inert placeholders (Phase 2 scope).
export default function NodeModal() {
  const {
    nodesById, selectedNodeId, setSelectedNodeId, renameNode, updateNodeDesc,
    updateNodeParam, setParamMapped, deleteNode, getUpstreamOutputFields,
  } = useWorkflow();
  const [tab, setTab] = useState("params");
  const [picker, setPicker] = useState(null); // { key, style }
  const node = selectedNodeId ? nodesById[selectedNodeId] : null;

  if (!node) return null;
  const meta = nodeTypeLibrary[node.type];
  if (!meta) return null;

  const upstream = getUpstreamOutputFields(node.id);

  function close() {
    setTab("params");
    setPicker(null);
    setSelectedNodeId(null);
  }

  function openPicker(key, anchorEl) {
    const r = anchorEl.getBoundingClientRect();
    const panelW = 280;
    setPicker({
      key,
      style: {
        left: Math.min(r.left, window.innerWidth - panelW - 12),
        top: Math.min(r.bottom + 8, window.innerHeight - 340),
      },
    });
  }

  function pickToken(token) {
    const state = node.params[picker.key];
    const current = state.value || "";
    updateNodeParam(node.id, picker.key, current ? current + " " + token : token);
    setPicker(null);
  }

  function applyFunction(fn) {
    const state = node.params[picker.key];
    const current = state.value || "";
    const lastClose = current.lastIndexOf("}}");
    if (lastClose === -1) return;
    const argsText = fn === "default" ? '"N/A"' : "";
    const next = current.slice(0, lastClose) + `.${fn}(${argsText})` + current.slice(lastClose);
    updateNodeParam(node.id, picker.key, next);
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
                <ParamField
                  key={p.key}
                  node={node}
                  param={p}
                  upstream={upstream}
                  updateNodeParam={updateNodeParam}
                  setParamMapped={setParamMapped}
                  onOpenPicker={openPicker}
                />
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

      {picker && (
        <FieldPicker upstream={upstream} onPick={pickToken} onFunction={applyFunction} style={picker.style} />
      )}
    </div>
  );
}
