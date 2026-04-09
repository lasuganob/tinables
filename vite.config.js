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
      includeAssets: [
        "logo.png",
        "logo-nav.png",
        "icon-512.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "apple-touch-icon.png"
      ],
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"]
      },
      manifest: {
        id: "/",
        name: "Tinables Cashflow",
        short_name: "Tinables",
        description: "Cashflow tracking PWA backed by Google Sheets and Apps Script.",
        theme_color: "#0f766e",
        background_color: "#f4f7fb",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
});
