import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  IconButton,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { SidebarNav } from "./SidebarNav";
import { useAppFeedbackContext } from "../context/AppDataContext";
import { AlertBox } from "../components/AlertBox";

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  const { error, setError, message, setMessage } = useAppFeedbackContext();

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }

    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!error && !message) {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [error, message]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setError("");
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [error, setError]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [message, setMessage]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(180deg, #f4f7fb 0%, #eef7f5 100%)" }}>
      <SidebarNav
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backgroundColor: "#4a6555",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Toolbar sx={{ gap: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                aria-label="open navigation"
              >
                <MenuRoundedIcon />
              </IconButton>
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <Box
                  component="img"
                  src="/logo-nav.png"
                  alt="Tinables"
                  sx={{ height: 34, width: "auto", display: "block", margin: "auto" }}
                />
              </Box>
            </Toolbar>
          </AppBar>
        )}

        {/* Feedback banners */}
        {error || message ? (
          <Box>
            {error ? (
              <AlertBox message={error} severity="error" onClose={() => setError(null)} />
            ) : null}
            {message ? (
              <AlertBox message={message} severity="success" onClose={() => setMessage(null)} />
            ) : null}
          </Box>
        ) : null}
        {isOffline ? (
          <Alert
            variant="outlined"
            severity="warning"
            sx={{ m: 2, mb: 0, backgroundColor: "#fff4cf" }}
          >
            You are offline. Cached pages remain available, but Google Sheets
            sync will resume when the connection returns.
          </Alert>
        ) : null}

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 1.25, sm: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
