import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on 5174 so it can run side by side with the legacy_UI
// static server (5173) during the port.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
});
