import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: { port: 3000, host: "0.0.0.0" },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  // مهم: يمنع كراش "process is not defined" لو فيه سطور process.env في الواجهة
  define: { "process.env": {} },
  // (اختياري) اخفي تحذير حجم الشُنكس
  // build: { chunkSizeWarningLimit: 1000 }
});
