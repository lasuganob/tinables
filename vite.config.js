import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ["@mui/material", "@mui/icons-material"],
          pickers: ["@mui/x-date-pickers", "dayjs"],
          charts: ["highcharts", "highcharts-react-official"]
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Tinables Cashflow",
        short_name: "Tinables",
        description: "Cashflow tracking PWA backed by Google Sheets and Apps Script.",
        theme_color: "#1d4ed8",
        background_color: "#f3efe6",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
});
