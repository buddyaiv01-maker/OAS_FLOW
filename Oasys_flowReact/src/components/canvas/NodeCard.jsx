import { useRef } from "react";
import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";

// Default card footprint used both here and by EdgeLayer's path math, matching legacy_UI's
// `el.offsetWidth || 196` / `el.offsetHeight || 58` fallback.
export const NODE_W = 196;
export const NODE_H = 58;

function nodeGradient(color) {
  return `linear-gradient(135deg, ${color}, ${color}cc)`;
}

// Port of the `.node` card createNode() builds in legacy_UI/app.js, now interactive: mousedown
// starts a drag (or opens the node modal on a plain click, distinguished by movement threshold),
// and the right-edge stub starts a connect-drag handled by the parent Canvas.
export default function NodeCard({ node, onMove, onClick, onStartConnect }) {
  const meta = nodeTypeLibrary[node.type];
  const dragState = useRef(null);

  if (!meta) return null;

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
      <button
        type="button"
        className="node-connector-stub"
        style={{ left: NODE_W - 11, top: NODE_H / 2 - 11, background: meta.color }}
        title="Drag to connect to another node"
        onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
      >
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}
