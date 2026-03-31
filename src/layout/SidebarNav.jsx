import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Collapse,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: <DashboardRoundedIcon /> },
  { label: "Transactions", to: "/transactions", icon: <ReceiptLongRoundedIcon /> },
  { label: "Budgets & Goals", to: "/budgets", icon: <SavingsRoundedIcon /> },
  { label: "Recurring Dues", to: "/recurring-dues", icon: <RepeatRoundedIcon /> },
  {
    label: "Managers",
    icon: <ManageAccountsRoundedIcon />,
    subItems: [
        { label: "Categories", to: "/managers/categories", icon: <CategoryRoundedIcon /> },
        { label: "Tags", to: "/managers/tags", icon: <SellRoundedIcon /> },
        { label: "Accounts", to: "/managers/accounts", icon: <AccountBalanceWalletRoundedIcon /> },
    ]
  },
];

export function SidebarNav({ mobileOpen, onMobileClose }) {
  const location = useLocation();
  const [managersOpen, setManagersOpen] = useState(false);

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#4a6555",
        color: "#fff",
      }}
    >
      <Toolbar sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Box
          component="img"
          src="/logo-nav.png"
          alt="Tinables"
          sx={{ width: "100%", maxWidth: 144, height: "auto", display: "block", margin: "auto" }}
        />
      </Toolbar>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, pb: 2 }}>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            if (item.subItems) {
              const isSubActive = location.pathname.startsWith("/managers");
              return (
                <Box key={item.label}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => setManagersOpen(!managersOpen)}
                      sx={{
                        borderRadius: 2.5,
                        px: 2,
                        py: 1.1,
                        color: isSubActive ? "#fff" : "rgba(255,255,255,0.65)",
                        backgroundColor: isSubActive && !managersOpen
                          ? "rgba(255,255,255,0.15)"
                          : "transparent",
                        backdropFilter: isSubActive && !managersOpen ? "blur(4px)" : "none",
                        transition: "all 0.18s ease",
                        "&:hover": {
                          backgroundColor: isSubActive
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(255,255,255,0.08)",
                          color: "#fff",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: "inherit",
                          "& svg": { fontSize: "1.2rem" },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.875rem",
                          fontWeight: isSubActive ? 700 : 500,
                        }}
                      />
                      {managersOpen ? <ExpandLess sx={{ fontSize: "1.2rem", color: "inherit" }} /> : <ExpandMore sx={{ fontSize: "1.2rem", color: "inherit" }} />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={managersOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 1.5, mb: 1 }}>
                      {item.subItems.map((subItem) => {
                        const isActive = location.pathname.startsWith(subItem.to);
                        return (
                          <ListItem key={subItem.to} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                              component={NavLink}
                              to={subItem.to}
                              onClick={onMobileClose}
                              sx={{
                                borderRadius: 2.5,
                                px: 1.5,
                                py: 0.8,
                                color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                                backgroundColor: isActive
                                  ? "rgba(255,255,255,0.15)"
                                  : "transparent",
                                transition: "all 0.18s ease",
                                "&:hover": {
                                  backgroundColor: isActive
                                    ? "rgba(255,255,255,0.2)"
                                    : "rgba(255,255,255,0.08)",
                                  color: "#fff",
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 32,
                                  color: "inherit",
                                  "& svg": { fontSize: "1.1rem" },
                                }}
                              >
                                {subItem.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={subItem.label}
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  fontWeight: isActive ? 600 : 400,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            const { label, to, icon } = item;
            const isActive =
              to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(to);

            return (
              <ListItem key={to} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={to}
                  end={to === "/"}
                  onClick={onMobileClose}
                  sx={{
                    borderRadius: 2.5,
                    px: 2,
                    py: 1.1,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                    backdropFilter: isActive ? "blur(4px)" : "none",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.08)",
                      color: "#fff",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: "inherit",
                      "& svg": { fontSize: "1.2rem" },
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            border: "none",
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop permanent sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            border: "none",
            boxSizing: "border-box",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
