// Stub for the port of legacy_UI/index.html's #nodeModalOverlay — the biggest single piece of
// app.js (params/settings tabs, field mapping, connection block, pin/run output). Not built yet.
export default function NodeModal({ open }) {
  if (!open) return null;
  return (
    <div className="modal-overlay is-open">
      <div className="node-modal">
        <p style={{ padding: 20 }}>Node modal — not ported yet.</p>
      </div>
    </div>
  );
}
