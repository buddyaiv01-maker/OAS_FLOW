// Faithful port of legacy_UI/index.html's <section class="canvas-wrap">. Node/edge rendering,
// drag-to-connect, pan/zoom and the field-mapping engine all still live in app.js and are the
// real porting work — this is the static shell plus the same empty-state message.
export default function Canvas() {
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
        <div className="canvas-inner">
          <svg className="edges" width="1200" height="640" viewBox="0 0 1200 640">
            <defs>
              <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F79106" />
                <stop offset="55%" stopColor="#3660B7" />
                <stop offset="100%" stopColor="#57177D" />
              </linearGradient>
            </defs>
          </svg>
          <div className="canvas-empty-state">
            <div className="canvas-empty-icon">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </div>
            <h3>Blank canvas</h3>
            <p>Click the <strong>+</strong> button below to add your first node.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
