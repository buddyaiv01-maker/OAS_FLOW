import { useRef, useState } from "react";
import { useWorkflow } from "../../state/WorkflowContext.jsx";
import { nodeTypeLibrary } from "../../lib/nodeTypeLibrary.js";
import NodeCard, { NODE_W, NODE_H } from "./NodeCard.jsx";
import EdgeLayer from "./EdgeLayer.jsx";

// Faithful port of legacy_UI's <section class="canvas-wrap"> — now with real node rendering,
// drag-to-move, and drag-to-connect. Pan/zoom/lock and the field-mapping engine are still TODO.
export default function Canvas() {
  const { nodesById, edges, moveNode, connectNodes, setSelectedNodeId } = useWorkflow();
  const canvasInnerRef = useRef(null);
  const [connecting, setConnecting] = useState(null); // { from, x, y }

  const nodeList = Object.values(nodesById);

  function toCanvasPoint(clientX, clientY) {
    const rect = canvasInnerRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handleStartConnect(fromId) {
    function onMouseMove(ev) {
      setConnecting({ from: fromId, ...toCanvasPoint(ev.clientX, ev.clientY) });
    }
    function onMouseUp(ev) {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const targetNodeEl = target && target.closest(".node");
      if (targetNodeEl && targetNodeEl.id !== fromId) connectNodes(fromId, targetNodeEl.id, null);
      setConnecting(null);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  const fromNode = connecting && nodesById[connecting.from];
  const tempLine = fromNode
    ? { from: { x: fromNode.x + NODE_W, y: fromNode.y + NODE_H / 2 }, to: { x: connecting.x, y: connecting.y }, color: (nodeTypeLibrary[fromNode.type] || {}).color }
    : null;

  return (
    <section className="canvas-wrap">
      <div className="canvas-controls">
        <button className="canvas-btn" title="Zoom in">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <button className="canvas-btn" title="Zoom out">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <button className="canvas-btn" title="Fit to screen">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="canvas-btn" title="Lock canvas">
          <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.7" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.7" /></svg>
        </button>
      </div>

      <div className="zoom-readout">100%</div>

      <div className="canvas">
        <div className="canvas-inner" ref={canvasInnerRef}>
          <EdgeLayer nodesById={nodesById} edges={edges} tempLine={tempLine} />

          {nodeList.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onMove={moveNode}
              onClick={setSelectedNodeId}
              onStartConnect={handleStartConnect}
            />
          ))}

          {nodeList.length === 0 && (
            <div className="canvas-empty-state">
              <div className="canvas-empty-icon">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </div>
              <h3>Blank canvas</h3>
              <p>Click the <strong>+</strong> button below to add your first node.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
