// Port target for legacy_UI/app.js's Phase 3-5 mock execution engine: computeExecutionOrderFor,
// getUpstreamOutputFieldsFor, mockExecuteNodeFor, defaultNodeExecute, runWorkflowMockFor, plus
// executeIterator/executeAggregator/executeTableNode/executeSubWorkflow. Pure logic — the only
// change needed for React is where `lastRunOutputs`/`tableStore` live (module state vs. context).
export function computeExecutionOrderFor(nodesById, edges) {
  return Object.keys(nodesById);
}
