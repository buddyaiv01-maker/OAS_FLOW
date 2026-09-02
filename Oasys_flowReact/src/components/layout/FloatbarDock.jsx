const TOOLBAR_ICONS = [
  { title: "Save", path: "M5 4h11l3 3v13H5V4Z M8 4v6h7V4M8 20v-6h8v6", strokeOnly: true },
  { title: "Undo", path: "M8 7 3 12l5 5M3 12h11a6 6 0 0 1 0 12h-1" },
  { title: "Redo", path: "m16 7 5 5-5 5M21 12H10A6 6 0 0 0 10 24h1" },
  { title: "Fit to screen", path: "M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z", grid: true },
  { title: "Auto align workflow", path: "M8 6.5h5a3 3 0 0 1 3 3V15a3 3 0 0 0 3 2.5M13 6.5h3" },
  { title: "Toggle hints", path: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7v.5h5.6v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z" },
  { title: "Toggle input / output view", circle: true, path: "M12 3.5v17" },
  { title: "Workflow settings", gear: true },
  { title: "Rename workflow", path: "m16.5 4.5 3 3L8 19l-4 1 1-4Z" },
  { title: "Executions history", circle: true, path: "M12 7.5V12l3 2" },
];

const QUICK_CATS = [
  { cat: "trigger", title: "Trigger nodes" },
  { cat: "logic", title: "Logic nodes" },
  { cat: "integrations", title: "Integration nodes" },
];

// Faithful-in-spirit port of legacy_UI/index.html's <div class="floatbar-dock">. Every button is
// still inert — wiring Execute, undo/redo, auto-align, and the add-node popup is the real port.
export default function FloatbarDock() {
  return (
    <div className="floatbar-dock">
      <div className="floatbar">
        <div className="floatbar-group floatbar-run">
          <button className="floatbar-run-btn">
            <svg viewBox="0 0 24 24" fill="none"><path d="M7 5v14l12-7Z" fill="currentColor" /></svg>
            Run once
          </button>
          <button className="floatbar-run-caret" title="Run options">
            <svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        <button className="floatbar-schedule">
          <span className="floatbar-schedule-switch"><span className="knob" /></span>
          Every 15 minutes
        </button>

        <div className="floatbar-divider" />

        <div className="floatbar-group">
          {TOOLBAR_ICONS.map((icon) => (
            <button key={icon.title} className="floatbar-icon" title={icon.title}>
              <svg viewBox="0 0 24 24" fill="none">
                {icon.gear
                  ? <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.4-2.4.6a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.7 7.7 0 0 0-2.6 1.5l-2.4-.6-2 3.4 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.4 2.4-.6a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.7 7.7 0 0 0 2.6-1.5l2.4.6 2-3.4-2-1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></>
                  : icon.circle
                    ? <><circle cx="12" cy="12" r={icon.title.includes("input") ? 8.5 : 8} stroke="currentColor" strokeWidth="1.6" /><path d={icon.path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>
                    : <path d={icon.path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </button>
          ))}
        </div>

        <div className="floatbar-divider" />

        <div className="floatbar-group floatbar-quick">
          {QUICK_CATS.map((q) => (
            <button key={q.cat} className={"floatbar-quick-btn quick-" + q.cat} title={q.title} data-cat={q.cat}>
              <svg viewBox="0 0 24 24" fill="none"><circle cx="7" cy="17" r="2.6" stroke="currentColor" strokeWidth="1.9" /><circle cx="17" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.9" /><circle cx="17" cy="17" r="2.6" stroke="currentColor" strokeWidth="1.9" /></svg>
            </button>
          ))}
          <button className="floatbar-quick-btn quick-ai" title="AI nodes"><span>AI</span></button>
          <button className="floatbar-add-btn" title="Add node">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
