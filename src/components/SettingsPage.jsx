import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Logout, Settings, Brightness4 } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Get user info from localStorage
    const storedStaff = localStorage.getItem("staff_details");
    if (storedStaff) {
      setUser(JSON.parse(storedStaff));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("staff_details");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        <Settings sx={{ mr: 1, verticalAlign: "middle" }} /> Settings
      </Typography>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 56, height: 56 }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{user?.name || "Unknown User"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || "No email"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {user?.role || "staff"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Preferences
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={() => {
                  setDarkMode(!darkMode);
                  toast.info(`Dark mode ${!darkMode ? "enabled" : "disabled"}`);
                }}
              />
            }
            label={<><Brightness4 sx={{ mr: 1, color: "text.secondary" }} /> Dark Mode</>}
          />
        </CardContent>
      </Card>

      <Card elevation={2}>
        <CardContent sx={{ textAlign: "center" }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
