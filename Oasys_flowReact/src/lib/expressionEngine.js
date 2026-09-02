// Ported near-verbatim from legacy_UI/app.js's expression engine (§3 of the build doc). Pure
// logic, no DOM — the only thing that changes for React is what supplies `upstream` (now derived
// from WorkflowContext's nodesById/edges instead of the vanilla app's closure globals).
export const EXPR_FUNCTIONS = {
  upper: (v) => String(v).toUpperCase(),
  lower: (v) => String(v).toLowerCase(),
  trim: (v) => String(v).trim(),
  length: (v) => String(String(v).length),
  toNumber: (v) => String(Number(v)),
  round: (v, args) => {
    const digits = Number(args[0]); const d = Number.isFinite(digits) ? digits : 0;
    const n = Number(v); if (!Number.isFinite(n)) return String(v);
    const f = Math.pow(10, d);
    return String(Math.round(n * f) / f);
  },
  default: (v, args) => (v === undefined || v === null || v === "" ? (args[0] ?? "") : v),
  split: (v, args) => String(v).split(args[0] || ",").join(" | "),
};

export const SAMPLE_FIELD_VALUES = {
  question: "What's the best pizza topping?",
  payload: '{"id":482,"email":"sam@example.com"}',
  headers: "content-type: application/json",
  body: "Hi there — thanks for reaching out!",
  subject: "Welcome aboard!",
  from: "sam@example.com",
  message: "Deployment finished successfully",
  channel: "#general",
  row: "Row 42",
  triggerTime: "2026-09-02T09:00:00Z",
  status: "200 OK",
  value: "Sample value",
  response: "Sure — here's a summary of what I found…",
  rows: "3 rows returned",
  output: "The agent completed the requested task.",
  errorMessage: "Request timed out after 30s",
  nodeName: "HTTP Request",
  workflowName: "Lead Capture Pipeline",
  timestamp: "2026-09-02T14:32:00Z",
  item: "Item A",
  array: '["Item A","Item B","Item C"]',
  record: '{"id":"rec-1","name":"Sample Record"}',
  recordId: "rec-1",
};

export function sampleValueFor(fieldKey, fieldLabel) {
  return SAMPLE_FIELD_VALUES[fieldKey] || `Sample ${fieldLabel || fieldKey}`;
}

// Splits raw `{{ }}` inner text into { nodeId, nodeName, fieldKey, fieldLabel, methods } by
// matching the longest "NodeName.fieldKey" prefix against the real, current upstream field list.
export function resolveExpressionRef(raw, upstream) {
  const candidates = upstream
    .map((o) => ({ ...o, prefix: `${o.nodeName}.${o.fieldKey}` }))
    .filter((o) => raw === o.prefix || raw.startsWith(o.prefix + "."))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  if (!candidates.length) return null;
  const match = candidates[0];
  const rest = raw.slice(match.prefix.length);
  const methods = [];
  const methodRe = /\.(\w+)\(([^)]*)\)/g;
  let mm;
  while ((mm = methodRe.exec(rest))) {
    const argsRaw = mm[2].trim();
    const args = argsRaw ? argsRaw.split(",").map((a) => a.trim().replace(/^["']|["']$/g, "")) : [];
    methods.push({ fn: mm[1], args });
  }
  return { nodeId: match.nodeId, nodeName: match.nodeName, fieldKey: match.fieldKey, fieldLabel: match.fieldLabel, methods };
}

export function parseFieldExpressions(text) {
  const re = /\{\{([^}]+)\}\}/g;
  const segments = [];
  let lastIndex = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) segments.push({ type: "literal", text: text.slice(lastIndex, m.index) });
    segments.push({ type: "expr", raw: m[1].trim() });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) segments.push({ type: "literal", text: text.slice(lastIndex) });
  return segments;
}

// Shared by the param "Preview:" line (sample data) and a real Execute run (once the execution
// engine is ported) — only how a resolved ref's raw value is looked up differs, via `resolveValue`.
export function evaluateExpression(text, upstream, resolveValue) {
  if (!text) return "";
  return parseFieldExpressions(text).map((seg) => {
    if (seg.type === "literal") return seg.text;
    const ref = resolveExpressionRef(seg.raw, upstream);
    if (!ref) return `{{${seg.raw}}}`; // unresolved reference — shown as-is, same as a broken link
    let val = resolveValue(ref);
    ref.methods.forEach(({ fn, args }) => {
      const impl = EXPR_FUNCTIONS[fn];
      if (impl) { try { val = impl(val, args); } catch (e) { /* leave val as-is on a bad call */ } }
    });
    return val;
  }).join("");
}

export function evaluateExpressionPreview(text, upstream) {
  return evaluateExpression(text, upstream, (ref) => sampleValueFor(ref.fieldKey, ref.fieldLabel));
}
