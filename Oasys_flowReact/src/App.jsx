import { useEffect, useState } from "react";
import { WorkflowProvider } from "./state/WorkflowContext.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import FloatbarDock from "./components/layout/FloatbarDock.jsx";
import Canvas from "./components/canvas/Canvas.jsx";
import NodeModal from "./components/modals/NodeModal.jsx";
import DashboardView from "./components/views/DashboardView.jsx";
import CredentialsView from "./components/views/CredentialsView.jsx";
import ExecutionsView from "./components/views/ExecutionsView.jsx";
import TemplatesView from "./components/views/TemplatesView.jsx";
import SettingsView from "./components/views/SettingsView.jsx";

const THEME_KEY = "oasysflow-react-theme";

function AppShell() {
  const [activeView, setActiveView] = useState("workflows");
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch (e) { return "light"; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }, [theme]);

  const showEditor = activeView === "workflows";

  return (
    <>
      <div className="app">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        />
        <main className="main">
          {showEditor && (
            <>
              <Topbar />
              <div className="workspace" id="workspaceView">
                <Canvas />
              </div>
              <FloatbarDock />
            </>
          )}
          {activeView === "dashboard" && <DashboardView onOpenWorkflow={() => setActiveView("workflows")} />}
          {activeView === "templates" && <TemplatesView />}
          {activeView === "credentials" && <CredentialsView />}
          {activeView === "executions" && <ExecutionsView />}
          {activeView === "settings" && <SettingsView />}
        </main>
      </div>
      <NodeModal />
    </>
  );
}

// Top-level shell mirroring legacy_UI/index.html's structure 1:1 (.app > .sidebar + .main),
// so the ported CSS applies unchanged — the UI is locked, only the implementation moves to React.
export default function App() {
  return (
    <WorkflowProvider>
      <AppShell />
    </WorkflowProvider>
  );
}
