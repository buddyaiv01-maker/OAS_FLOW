import { useState } from "react";
import { useWorkflow } from "../../state/WorkflowContext.jsx";

// Faithful port of legacy_UI/index.html's <header class="topbar">. Undo/redo, execute, save,
// active-switch and the export/import menu are all still wired to nothing — UI shell only.
export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { workflows, currentWorkflowId, renameWorkflow, executeWorkflow } = useWorkflow();
  const wf = workflows.find((w) => w.id === currentWorkflowId);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1
          className="wf-title"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => currentWorkflowId && renameWorkflow(currentWorkflowId, e.target.textContent.trim() || wf?.name)}
        >
          {wf ? wf.name : "No workflow selected"}
        </h1>
        <button className="icon-btn" title="Rename">
          <svg viewBox="0 0 24 24" fill="none"><path d="m16.5 4.5 3 3L8 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </button>
        <span className="autosave">Saved just now</span>
      </div>
      <div className="topbar-mid">
        <button className="ghost-btn" disabled>
          <svg viewBox="0 0 24 24" fill="none"><path d="M8 7 3 12l5 5M3 12h11a6 6 0 0 1 0 12h-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Undo
        </button>
        <button className="ghost-btn" disabled>
          <svg viewBox="0 0 24 24" fill="none"><path d="m16 7 5 5-5 5M21 12H10A6 6 0 0 0 10 24h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Redo
        </button>
        <button className="run-btn" onClick={executeWorkflow}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M7 5v14l12-7Z" fill="currentColor" /></svg>
          Execute
        </button>
        <button className="save-btn">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 4h11l3 3v13H5V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 4v6h7V4M8 20v-6h8v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          Save
        </button>
      </div>
      <div className="topbar-right">
        <span className="active-label">Active</span>
        <button className="switch is-on" role="switch" aria-checked="true"><span className="knob" /></button>
        <div className="more-menu-wrap">
          <button className="icon-btn" title="More" onClick={() => setMenuOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="19" r="1.6" fill="currentColor" /></svg>
          </button>
          <div className={"more-menu" + (menuOpen ? " is-open" : "")}>
            <button className="more-menu-item">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12M12 15l-4-4M12 15l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Export as JSON
            </button>
            <button className="more-menu-item">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 15V3M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Import from JSON…
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
