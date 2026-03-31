import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseIcon from "@mui/icons-material/Close";
import { SidebarNav } from "./SidebarNav";
import { useAppFeedbackContext } from "../context/AppDataContext";

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
              background: "linear-gradient(90deg, #0f766e 0%, #134e4a 100%)",
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
              <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                Tinables Cashflow
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Feedback banners */}
        {error ? (
          <Alert
            variant="outlined"
            severity="error"
            sx={{ m: 2, mb: 0, backgroundColor: "#ffcdcdff" }}
            action={
              <IconButton
                aria-label="close error"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        ) : null}
        {message ? (
          <Alert
            variant="outlined"
            severity="success"
            sx={{ m: 2, mb: 0, backgroundColor: "#d4edda" }}
            action={
              <IconButton
                aria-label="close message"
                color="inherit"
                size="small"
                onClick={() => setMessage(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {message}
          </Alert>
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
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
