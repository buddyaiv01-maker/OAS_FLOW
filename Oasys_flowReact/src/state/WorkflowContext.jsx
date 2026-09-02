import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { nodeTypeLibrary } from "../lib/nodeTypeLibrary.js";
import { loadPersistedState, savePersistedState } from "../lib/persistence.js";

// Port target for legacy_UI/app.js's global closure state (nodeData/edgeList/workflows/
// workflowCanvasData), now React state. The CURRENTLY open workflow's nodes/edges live directly
// in state (nodesById/edges); switching workflows snapshots them into workflowCanvasData and
// loads the target's, mirroring snapshotCurrentCanvasInto()/buildWorkflowCanvas() in the legacy app.
const WorkflowContext = createContext(null);

const SEED_WORKFLOW_ID = "wf-demo";

function seedState() {
  return {
    workflows: [{ id: SEED_WORKFLOW_ID, name: "My First Workflow", status: "draft" }],
    currentWorkflowId: SEED_WORKFLOW_ID,
    workflowCanvasData: { [SEED_WORKFLOW_ID]: { nodes: [], edges: [] } },
  };
}

export function WorkflowProvider({ children }) {
  const persisted = useRef(loadPersistedState());
  const initial = persisted.current || seedState();

  const [workflows, setWorkflows] = useState(initial.workflows);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(initial.currentWorkflowId);
  const [workflowCanvasData, setWorkflowCanvasData] = useState(initial.workflowCanvasData);

  const initialCanvas = initial.workflowCanvasData[initial.currentWorkflowId] || { nodes: [], edges: [] };
  const [nodesById, setNodesById] = useState(() => {
    const map = {};
    initialCanvas.nodes.forEach((n) => { map[n.id] = n; });
    return map;
  });
  const [edges, setEdges] = useState(initialCanvas.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const nodeCounter = useRef(0);
  const wfCounter = useRef(0);

  // Persist on every meaningful change (debounced), same idea as legacy's schedulePersist().
  useEffect(() => {
    const timer = setTimeout(() => {
      const snapshot = {
        ...workflowCanvasData,
        [currentWorkflowId]: { nodes: Object.values(nodesById), edges },
      };
      savePersistedState({ workflows, currentWorkflowId, workflowCanvasData: snapshot });
    }, 400);
    return () => clearTimeout(timer);
  }, [workflows, currentWorkflowId, workflowCanvasData, nodesById, edges]);

  function snapshotCurrentInto(store) {
    return { ...store, [currentWorkflowId]: { nodes: Object.values(nodesById), edges } };
  }

  function selectWorkflow(id) {
    if (id === currentWorkflowId) return;
    const nextStore = snapshotCurrentInto(workflowCanvasData);
    setWorkflowCanvasData(nextStore);
    const target = nextStore[id] || { nodes: [], edges: [] };
    const map = {};
    target.nodes.forEach((n) => { map[n.id] = n; });
    setNodesById(map);
    setEdges(target.edges);
    setCurrentWorkflowId(id);
    setSelectedNodeId(null);
  }

  function createWorkflow() {
    wfCounter.current += 1;
    const id = "wf-" + Date.now() + "-" + wfCounter.current;
    const nextStore = snapshotCurrentInto(workflowCanvasData);
    nextStore[id] = { nodes: [], edges: [] };
    setWorkflowCanvasData(nextStore);
    setWorkflows((prev) => [{ id, name: "Untitled Workflow", status: "draft" }, ...prev]);
    setNodesById({});
    setEdges([]);
    setCurrentWorkflowId(id);
    setSelectedNodeId(null);
  }

  function deleteWorkflow(id) {
    setWorkflows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      if (id === currentWorkflowId) {
        const store = { ...workflowCanvasData };
        delete store[id];
        setWorkflowCanvasData(store);
        const fallback = next[0];
        if (fallback) {
          const target = store[fallback.id] || { nodes: [], edges: [] };
          const map = {};
          target.nodes.forEach((n) => { map[n.id] = n; });
          setNodesById(map);
          setEdges(target.edges);
          setCurrentWorkflowId(fallback.id);
        } else {
          setNodesById({});
          setEdges([]);
          setCurrentWorkflowId(null);
        }
        setSelectedNodeId(null);
      }
      return next;
    });
  }

  function renameWorkflow(id, name) {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
  }

  function addNode(type, x, y) {
    const meta = nodeTypeLibrary[type];
    if (!meta) return null;
    nodeCounter.current += 1;
    const id = "node-" + Date.now() + "-" + nodeCounter.current;
    const params = {};
    (meta.params || []).forEach((p) => { params[p.key] = { value: p.default || "", mapped: false }; });
    const node = { id, type, x, y, sub: "Untitled", desc: `Configure this ${meta.label} node.`, params };
    setNodesById((prev) => ({ ...prev, [id]: node }));
    return id;
  }

  function moveNode(id, x, y) {
    setNodesById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev));
  }

  // A mapped field stores its reference as literal `{{NodeName.field...}}` text. If the source
  // node is renamed, every OTHER field that mapped to it must be rewritten too, or the mapping
  // silently breaks (the token would still read the old name and no longer resolve to any node).
  function cascadeNodeRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    const oldPrefix = `{{${oldName}.`;
    const newPrefix = `{{${newName}.`;
    setNodesById((prev) => {
      let touched = false;
      const next = { ...prev };
      Object.values(next).forEach((n) => {
        Object.entries(n.params || {}).forEach(([key, p]) => {
          if (p.mapped && typeof p.value === "string" && p.value.includes(oldPrefix)) {
            const newValue = p.value.split(oldPrefix).join(newPrefix);
            next[n.id] = { ...next[n.id], params: { ...next[n.id].params, [key]: { ...next[n.id].params[key], value: newValue } } };
            touched = true;
          }
        });
      });
      return touched ? next : prev;
    });
  }

  function renameNode(id, sub) {
    const oldName = nodesById[id] && nodesById[id].sub;
    setNodesById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], sub } } : prev));
    cascadeNodeRename(oldName, sub);
  }

  function updateNodeDesc(id, desc) {
    setNodesById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], desc } } : prev));
  }

  function updateNodeParam(id, key, value) {
    setNodesById((prev) => {
      const node = prev[id];
      if (!node || !node.params[key]) return prev;
      return { ...prev, [id]: { ...node, params: { ...node.params, [key]: { ...node.params[key], value } } } };
    });
  }

  function setParamMapped(id, key, mapped) {
    setNodesById((prev) => {
      const node = prev[id];
      if (!node || !node.params[key]) return prev;
      return { ...prev, [id]: { ...node, params: { ...node.params, [key]: { ...node.params[key], mapped } } } };
    });
  }

  // BFS backward through edges collecting every ancestor's outputFields — what the field-picker
  // and expression evaluator resolve `{{NodeName.field}}` references against.
  function getUpstreamOutputFields(nodeId) {
    const visited = new Set();
    const queue = edges.filter((e) => e.to === nodeId).map((e) => e.from);
    const options = [];
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodesById[id];
      const meta = node && nodeTypeLibrary[node.type];
      if (meta && meta.outputFields) {
        meta.outputFields.forEach((f) => options.push({ nodeId: id, nodeName: (node && node.sub) || meta.label, fieldKey: f.key, fieldLabel: f.label }));
      }
      edges.filter((e) => e.to === id).forEach((e) => queue.push(e.from));
    }
    return options;
  }

  function deleteNode(id) {
    setNodesById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedNodeId((prev) => (prev === id ? null : prev));
  }

  function connectNodes(from, to, branch) {
    if (from === to) return;
    setEdges((prev) => {
      const exists = prev.some((e) => e.from === from && e.to === to && (e.branch || null) === (branch || null));
      return exists ? prev : [...prev, { from, to, branch: branch || null }];
    });
  }

  function removeEdge(from, to, branch) {
    setEdges((prev) => prev.filter((e) => !(e.from === from && e.to === to && (e.branch || null) === (branch || null))));
  }

  const value = useMemo(() => ({
    workflows, currentWorkflowId, nodesById, edges, selectedNodeId,
    setSelectedNodeId, selectWorkflow, createWorkflow, deleteWorkflow, renameWorkflow,
    addNode, moveNode, renameNode, updateNodeDesc, updateNodeParam, setParamMapped, deleteNode,
    connectNodes, removeEdge, getUpstreamOutputFields,
  }), [workflows, currentWorkflowId, nodesById, edges, selectedNodeId]);

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within a WorkflowProvider");
  return ctx;
}
