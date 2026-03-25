import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layout/DashbordLayout";
import AddItemPage from "./components/AddItemPage";
import InventoryPage from "./components/InventoryPage";
import POSPage from "./components/POSPage";
import SalesHistoryPage from "./components/SalesHistoryPage";
import StaffPage from "./components/StaffPage";
import SuppliersPage from "./components/SuppliersPage";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import SettingsPage from "./components/SettingsPage";

import { Toaster } from "sonner";

// -----------------------
// Helper: Auth Guard
// -----------------------
function RequireAuth({ children, roleRequired = null }) {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("role"); // stored on login/register (manager | staff)

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Optional: restrict based on role
  if (roleRequired && userRole !== roleRequired) {
    // redirect staff trying to access manager-only page
    if (userRole === "staff") {
      return <Navigate to="/pos" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          {/* Manager and staff share POS */}
          <Route index element={<DashboardPage />} />

          {/* Manager-only pages */}
          <Route
            path="inventory"
            element={
              <RequireAuth roleRequired="manager">
                <InventoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="sales"
            element={
              <RequireAuth roleRequired="manager">
                <SalesHistoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="suppliers"
            element={
              <RequireAuth roleRequired="manager">
                <SuppliersPage />
              </RequireAuth>
            }
          />
          <Route
            path="staff"
            element={
              <RequireAuth roleRequired="manager">
                <StaffPage />
              </RequireAuth>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="add-item"
            element={
              <RequireAuth roleRequired="manager">
                <AddItemPage />
              </RequireAuth>
            }
          />

          {/* POS page is accessible by both manager and staff */}
          <Route path="pos" element={<POSPage />} />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={
            <RequireAuth>
              <Navigate to="/" replace />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
