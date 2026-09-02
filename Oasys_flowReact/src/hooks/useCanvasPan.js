import { useRef } from "react";

// Port target for legacy_UI/app.js's canvas mousedown/mousemove/mouseup pan-drag handling.
// Stubbed until the real Canvas drag/zoom/connect port happens.
export function useCanvasPan() {
  const canvasRef = useRef(null);
  return { canvasRef };
}
