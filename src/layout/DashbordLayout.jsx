import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  Divider,
  ListItemIcon,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 220;

const menuItems = [
  { text: "Dashboard", path: "/" },
  { text: "POS", path: "/pos" },
  { text: "Sales History", path: "/sales" },
  { text: "Suppliers", path: "/suppliers" },
  { text: "Inventory", path: "/inventory" },
  { text: "Staff", path: "/staff" },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#0d1117",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between", // Push settings to bottom
          },
        }}
      >
        <Box>
          <Toolbar>
            <Typography variant="h6" noWrap>
              My Inventory
            </Typography>
          </Toolbar>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "#1f2937",
                    },
                    "&:hover": { backgroundColor: "#374151" },
                  }}
                >
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Settings section */}
        <Box>
          <Divider sx={{ borderColor: "#374151" }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/settings"
                selected={location.pathname === "/settings"}
                sx={{
                  "&.Mui-selected": { backgroundColor: "#1f2937" },
                  "&:hover": { backgroundColor: "#374151" },
                }}
              >
                <ListItemIcon>
                  <SettingsIcon sx={{ color: "#fff" }} />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        {/* Top bar */}
        <AppBar position="sticky" color="default" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Inventory Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
