// Presentational port of the `.node` card createNode() builds in legacy_UI/app.js. Not wired
// into Canvas yet — drag/connect/select behavior is part of the real canvas port.
export default function NodeCard({ id, x, y, badgeClass, icon, stepLabel, name, color }) {
  return (
    <div
      id={id}
      className="node node-color-fill"
      style={{ left: x, top: y, background: color }}
    >
      <div className={"node-badge " + badgeClass}>
        <svg viewBox="0 0 24 24" fill="none">{icon}</svg>
      </div>
      <div className="node-text">
        <span className="node-step">{stepLabel}</span>
        <span className="node-name">{name}</span>
      </div>
    </div>
  );
}
