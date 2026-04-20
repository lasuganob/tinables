import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./styles.css";
import { SpeedInsights } from "@vercel/speed-insights/react"

registerSW({ immediate: true });

const theme = createTheme({
  palette: {
    primary: {
      main: "#0f766e"
    },
    secondary: {
      main: "#1d4ed8"
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif'
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MantineProvider>
          <DatesProvider settings={{ firstDayOfWeek: 1, consistentWeeks: true }}>
            <CssBaseline />
            <App />
            <SpeedInsights />
          </DatesProvider>
        </MantineProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
