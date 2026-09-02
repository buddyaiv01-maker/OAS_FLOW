import { useRef } from "react";
import { nodeTypeLibrary, getNodeBranches } from "../../lib/nodeTypeLibrary.js";

// Default card footprint used both here and by EdgeLayer's path math, matching legacy_UI's
// `el.offsetWidth || 196` / `el.offsetHeight || 58` fallback.
export const NODE_W = 196;
export const NODE_H = 58;

function nodeGradient(color) {
  return `linear-gradient(135deg, ${color}, ${color}cc)`;
}

// Vertical offset for the Nth of `n` output stubs, matching legacy_UI's nodeAnchor() branch math.
export function branchOffset(idx, n) {
  return (Math.max(idx, 0) - (n - 1) / 2) * 34;
}

// Port of the `.node` card createNode() builds in legacy_UI/app.js, now interactive: mousedown
// starts a drag (or opens the node modal on a plain click, distinguished by movement threshold).
// Output stubs are branch-aware — Router/If-Else nodes and any node with "use error output" (§6)
// on get one stub per branch, offset vertically like the legacy canvas.
export default function NodeCard({ node, onMove, onClick, onStartConnect }) {
  const meta = nodeTypeLibrary[node.type];
  const dragState = useRef(null);

  if (!meta) return null;
  const branches = getNodeBranches(node);
  const stubs = branches.length ? branches : [null];

  function handleMouseDown(e) {
    if (e.target.closest(".node-connector-stub")) return;
    e.stopPropagation();
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y, moved: false };

    function onMouseMove(ev) {
      const d = dragState.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      onMove(node.id, d.origX + dx, d.origY + dy);
    }
    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (dragState.current && !dragState.current.moved) onClick(node.id);
      dragState.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      id={node.id}
      className="node node-color-fill"
      style={{ left: node.x, top: node.y, background: nodeGradient(meta.color) }}
      onMouseDown={handleMouseDown}
    >
      <div className={"node-badge " + meta.badge}>
        <svg viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: meta.icon }} />
      </div>
      <div className="node-text">
        <span className="node-step">{meta.label}</span>
        <span className="node-name">{node.sub}</span>
      </div>
      <span className="node-connector-receiver" style={{ left: -6, top: NODE_H / 2 - 6 }} />
      {stubs.map((branch, idx) => {
        const offset = stubs.length > 1 ? branchOffset(idx, stubs.length) : 0;
        const isError = branch && branch.isError;
        return (
          <div key={branch ? (branch.key || "default") + "-" + idx : "single"}>
            {branch && branch.label && (
              <span
                className={"node-branch-label" + (isError ? " is-error" : "")}
                style={{ left: NODE_W + 16, top: NODE_H / 2 + offset }}
              >
                <span className={"branch-else" + (isError ? " is-error" : "")}>{branch.label}</span>
              </span>
            )}
            <button
              type="button"
              className={"node-connector-stub" + (isError ? " is-error" : "")}
              style={{ left: NODE_W - 11, top: NODE_H / 2 - 11 + offset, background: isError ? "var(--danger)" : meta.color }}
              title={branch ? `Drag to connect "${branch.label}"` : "Drag to connect to another node"}
              onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id, branch ? branch.key : null); }}
            >
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
