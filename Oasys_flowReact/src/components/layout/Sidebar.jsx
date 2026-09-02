import { useWorkflow } from "../../state/WorkflowContext.jsx";

const NAV_ITEMS = [
  { view: "dashboard", label: "Dashboard", icon: <path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-5H4v5Zm10-11h6V4h-6v5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /> },
  { view: "workflows", label: "Workflows", icon: <><circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" /><circle cx="18" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" /><path d="M8.1 7.1 10.5 16M15.9 7.1 13.5 16M8.4 6h7.2" stroke="currentColor" strokeWidth="1.6" /></> },
  { view: "templates", label: "Templates", icon: <><rect x="4" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.6" /></> },
  { view: "credentials", label: "Credentials", icon: <><circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" /><path d="m11 11 8.5 8.5M16.5 15.5l2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></> },
  { view: "executions", label: "Executions", icon: <><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></> },
  { view: "settings", label: "Settings", icon: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.4-2.4.6a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.7 7.7 0 0 0-2.6 1.5l-2.4-.6-2 3.4 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.4 2.4-.6a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.7 7.7 0 0 0 2.6-1.5l2.4.6 2-3.4-2-1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></> },
];

// Faithful port of legacy_UI/index.html's <aside class="sidebar">, with real view routing and
// theme toggling (lifted to App.jsx since both affect layout outside the sidebar too).
export default function Sidebar({ activeView, onNavigate, theme, onToggleTheme }) {
  const { workflows, currentWorkflowId, selectWorkflow, createWorkflow, deleteWorkflow } = useWorkflow();

  return (
    <aside className="sidebar" id="sidebar">
      <div className="brand">
        <img src="/OasysFlowLogo.png" alt="Oasys Flow" className="brand-mark" />
        <div className="brand-word">
          <span className="brand-name">Oasys<em>Flow</em></span>
          <span className="brand-tag">Workflow Studio</span>
        </div>
        <button className="sidebar-collapse-btn" title="Collapse sidebar">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <button className="btn-new-workflow" title="New Workflow" onClick={createWorkflow}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        <span>New Workflow</span>
      </button>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.view}
            className={"nav-item" + (activeView === item.view ? " is-active" : "")}
            title={item.label}
            onClick={() => onNavigate(item.view)}
          >
            <svg viewBox="0 0 24 24" fill="none">{item.icon}</svg>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="wf-list">
        <div className="wf-list-head">
          <button className="collapse-chev" title="Collapse workflow list">
            <svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span>Workflow List</span>
          <button className="icon-btn-sm" title="Add workflow">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <ul>
          {workflows.map((wf) => (
            <li
              key={wf.id}
              className={"wf-item" + (wf.id === currentWorkflowId ? " is-active" : "")}
              onClick={() => { selectWorkflow(wf.id); onNavigate("workflows"); }}
            >
              <span className={"dot" + (wf.status === "active" ? " dot-live" : "")} />
              <span className="wf-item-name">{wf.name}</span>
              <button
                className="wf-item-delete"
                title="Delete workflow"
                onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }}
              >
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-user">
        <div className="avatar">JM</div>
        <div className="user-meta">
          <span className="user-name">Jason</span>
          <span className="user-plan">Pro Plan</span>
        </div>
        <button className="theme-toggle" title="Toggle light / dark mode" onClick={onToggleTheme}>
          <svg className="icon-sun" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <svg className="icon-moon" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </aside>
  );
}
