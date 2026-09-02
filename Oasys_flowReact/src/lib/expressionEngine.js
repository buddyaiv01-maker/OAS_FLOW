// Port target for legacy_UI/app.js's expression engine: EXPR_FUNCTIONS, SAMPLE_FIELD_VALUES,
// sampleValueFor, resolveExpressionRef, parseFieldExpressions, evaluateExpression(Preview).
// Also pure logic (no DOM) — ports over as-is once nodeTypeLibrary exists to reference.
export function parseFieldExpressions(text) {
  return [{ type: "literal", text }];
}
