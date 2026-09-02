import { nodeTypeLibrary, getUpstreamOutputFieldsFor } from "./nodeTypeLibrary.js";
import { evaluateExpression, sampleValueFor } from "./expressionEngine.js";

// Port of legacy_UI/app.js's Phase 3 mock execution engine (§2 item model). No real backend —
// "executing" walks the graph in topological order, resolving each node's mapped params against
// REAL upstream run data (same expression engine as the Preview line, fed run data instead of
// samples), then produces an n8n-shaped item ({ json, pairedItem }). Where a node's output can't
// be known without a real integration call, it falls back to the same sample-value map used for
// previews, always labeled "Mock response…" rather than inventing a fake real one.
//
// Scoped to what legacy called Phase 3 — Iterator/Aggregator/Table/Execute Workflow's special
// item-shape behavior is Phase 4 (Composition) and isn't ported here yet.
const OUTPUT_DERIVATION = {
  set: { value: (rp) => rp.value },
  output: { value: (rp) => rp.value },
  slack: { message: (rp) => rp.message, channel: (rp) => rp.channel },
  sheet: { row: (rp) => rp.row },
  chatInterface: { question: (rp) => rp.sampleQuestion },
  schedule: { triggerTime: () => new Date().toISOString() },
  gmail: {
    subject: (rp) => rp.subject,
    body: (rp) => rp.body,
    from: (rp, ij, meta) => meta.connection && meta.connection.account,
  },
  openrouter: { response: (rp) => `Mock response from ${rp.model || "the model"} — you said: "${rp.content || ""}"` },
  ollama: { response: (rp) => `Mock response to: "${rp.prompt || ""}"` },
  http: {
    body: (rp) => (rp.url ? `Mock ${rp.method || "GET"} response body for ${rp.url}` : undefined),
    status: () => "200 OK",
  },
  mysql: { rows: (rp) => (rp.query ? JSON.stringify(["Row 1", "Row 2", "Row 3"]) : undefined) },
};

function deriveOutputValue(type, key, resolvedParams, inputJson, meta) {
  const fn = OUTPUT_DERIVATION[type] && OUTPUT_DERIVATION[type][key];
  if (fn) {
    try {
      const v = fn(resolvedParams, inputJson, meta);
      if (v !== undefined && v !== "") return v;
    } catch (e) { /* fall through to the sample value below */ }
  }
  return sampleValueFor(key);
}

// Kahn's algorithm — nodes with no incoming edge run first, then whatever they unblock.
export function computeExecutionOrderFor(nodesById, edges) {
  const ids = Object.keys(nodesById);
  const indegree = {};
  ids.forEach((id) => { indegree[id] = 0; });
  edges.forEach((e) => { if (indegree[e.to] != null) indegree[e.to]++; });
  const queue = ids.filter((id) => indegree[id] === 0);
  const order = [];
  const visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    order.push(id);
    edges.filter((e) => e.from === id).forEach((e) => {
      if (indegree[e.to] == null) return;
      indegree[e.to]--;
      if (indegree[e.to] === 0) queue.push(e.to);
    });
  }
  ids.forEach((id) => { if (!visited.has(id)) order.push(id); }); // defensive: stray cycle
  return order;
}

function mockExecuteNodeFor(id, upstreamItems, nodesById, edges, runtimeOutputs) {
  const node = nodesById[id];
  const meta = nodeTypeLibrary[node.type];
  const upstream = getUpstreamOutputFieldsFor(id, nodesById, edges);
  const inputJson = (upstreamItems[0] && upstreamItems[0].json) || {};

  const resolvedParams = {};
  Object.entries(node.params || {}).forEach(([key, p]) => {
    resolvedParams[key] = p.mapped
      ? evaluateExpression(p.value, upstream, (ref) => {
          const out = runtimeOutputs[ref.nodeId];
          const item = out && out[0];
          const val = item && item.json ? item.json[ref.fieldKey] : undefined;
          return val !== undefined ? val : sampleValueFor(ref.fieldKey, ref.fieldLabel);
        })
      : p.value;
  });

  if (!meta.outputFields || !meta.outputFields.length) {
    // Router/Filter/Delay-style nodes don't declare an output shape — Make.com semantics: they
    // route or gate, they don't transform, so items just pass through untouched.
    return upstreamItems.length ? upstreamItems : [{ json: inputJson }];
  }

  const json = {};
  meta.outputFields.forEach((f) => { json[f.key] = deriveOutputValue(node.type, f.key, resolvedParams, inputJson, meta); });
  return [{ json, pairedItem: { item: 0 } }];
}

export function runWorkflowMockFor(nodesById, edges) {
  const order = computeExecutionOrderFor(nodesById, edges);
  const runtimeOutputs = Object.create(null);
  order.forEach((id) => {
    const node = nodesById[id];
    if (!node) return;
    const incoming = edges.filter((e) => e.to === id);
    const upstreamItems = incoming.length ? incoming.flatMap((e) => runtimeOutputs[e.from] || []) : [];
    runtimeOutputs[id] = (node.pinnedData && node.pinnedData.length)
      ? node.pinnedData
      : mockExecuteNodeFor(id, upstreamItems, nodesById, edges, runtimeOutputs);
  });
  return { order, runtimeOutputs };
}
