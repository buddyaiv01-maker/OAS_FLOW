import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import FloatbarDock from "./components/layout/FloatbarDock.jsx";
import Canvas from "./components/canvas/Canvas.jsx";

// Top-level shell mirroring legacy_UI/index.html's structure 1:1 (.app > .sidebar + .main),
// so the ported CSS applies unchanged — the UI is locked, only the implementation moves to React.
export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="workspace" id="workspaceView">
          <Canvas />
        </div>
        <FloatbarDock />
      </main>
    </div>
  );
}
