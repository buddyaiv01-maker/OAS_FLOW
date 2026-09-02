import { createContext, useContext, useState } from "react";

// Port target for legacy_UI/app.js's global state: workflows[], currentWorkflowId, nodeData{},
// edgeList[], credentialStore{}, workflowCanvasData{}, executionRuns[], tableStore{}. In the
// vanilla app these were closure variables mutated directly; here they become context state.
const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);

  const value = { workflows, setWorkflows, currentWorkflowId, setCurrentWorkflowId };
  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within a WorkflowProvider");
  return ctx;
}
