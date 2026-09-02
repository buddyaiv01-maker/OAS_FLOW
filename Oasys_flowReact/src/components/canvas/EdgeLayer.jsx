import { nodeTypeLibrary, getNodeBranches } from "../../lib/nodeTypeLibrary.js";
import { NODE_W, NODE_H, branchOffset } from "./NodeCard.jsx";

function anchor(node, side, branchKey) {
  if (side === "left") return { x: node.x, y: node.y + NODE_H / 2 };
  const branches = getNodeBranches(node);
  if (!branches.length) return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
  const idx = branchKey ? branches.findIndex((b) => b.key === branchKey) : 0;
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 + branchOffset(Math.max(idx, 0), branches.length) };
}

function pathBetween(a, b) {
  const dx = Math.max(40, (b.x - a.x) / 2);
  return `M ${a.x},${a.y} C ${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
}

// Port of the gradient-edge rendering in legacy_UI/app.js's redrawEdges()/ensureEdgeGradient() —
// one <linearGradient> per edge blending source -> target node color, same as the vanilla app.
export default function EdgeLayer({ nodesById, edges, tempLine }) {
  return (
    <svg className="edges">
      <defs>
        {edges.map((e) => {
          const from = nodesById[e.from];
          const to = nodesById[e.to];
          if (!from || !to) return null;
          const fromColor = (nodeTypeLibrary[from.type] || {}).color || "#F79106";
          const toColor = (nodeTypeLibrary[to.type] || {}).color || "#F79106";
          const a = anchor(from, "right", e.branch);
          const b = anchor(to, "left");
          return (
            <linearGradient key={e.from + "-" + e.to + "-" + (e.branch || "")} id={"edgegrad-" + e.from + "-" + e.to} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
              <stop offset="0%" stopColor={fromColor} />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          );
        })}
      </defs>
      {edges.map((e) => {
        const from = nodesById[e.from];
        const to = nodesById[e.to];
        if (!from || !to) return null;
        const d = pathBetween(anchor(from, "right", e.branch), anchor(to, "left"));
        return <path key={e.from + "-" + e.to + "-" + (e.branch || "")} className="edge" d={d} stroke={`url(#edgegrad-${e.from}-${e.to})`} />;
      })}
      {tempLine && <path className="edge-temp" d={pathBetween(tempLine.from, tempLine.to)} stroke={tempLine.color} />}
    </svg>
  );
}
