// src/components/StaffPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People,
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  PersonOff,
  Person,
} from "@mui/icons-material";
import { toast } from "sonner";
import apiClient, { getStaff, addStaff, updateStaff, deleteStaff } from "../api/apiClient";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState({ open: false, mode: null }); // mode: 'add'|'edit'|'view'
  const [selected, setSelected] = useState(null);

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    role: "cashier",
    department: "General",
    salary: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Fetch staff on mount
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getStaff();
        // Depending on your backend, res.data could be an array or { results: [...] }
        const data = Array.isArray(res.data) ? res.data : res.data.results ?? res.data;
        if (mounted) setStaff(data);
      } catch (err) {
        console.error("Failed to load staff:", err);
        setError("Failed to load staff.");
        toast.error("Failed to load staff.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Derived stats
  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const totalPayroll = staff
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (parseFloat(s.salary || 0) || 0), 0);

  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Helpers
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

  // Add staff
  const handleAdd = async () => {
    // basic validation
    if (!form.name || !form.email) {
      toast.error("Please provide name and email");
      return;
    }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || "",
      role: form.role || "cashier",
      department: form.department || "General",
      salary: form.salary ? parseFloat(form.salary) : 0,
      // hire_date and status are handled by the backend (hire_date auto_now_add, status default 'active')
    };
    try {
      const res = await addStaff(payload);
      setStaff((prev) => [...prev, res.data]);
      setDialog({ open: false, mode: null });
      setForm(emptyForm);
      toast.success("Staff added");
    } catch (err) {
      console.error("Add staff error:", err);
      // try to show backend validation errors if present
      const msg = err?.response?.data || "Failed to add staff";
      toast.error(typeof msg === "string" ? msg : "Failed to add staff (check fields)");
    }
  };

  // Open edit dialog
  const openEdit = (s) => {
    setSelected(s);
    setForm({
      name: s.name || "",
      email: s.email || "",
      phone: s.phone || "",
      role: s.role || "cashier",
      department: s.department || "General",
      salary: s.salary ? String(s.salary) : "",
    });
    setDialog({ open: true, mode: "edit" });
  };

  // Save edit
  const handleEdit = async () => {
    if (!selected) return;
    if (!form.name || !form.email) {
      toast.error("Please provide name and email");
      return;
    }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || "",
      role: form.role || "cashier",
      department: form.department || "General",
      salary: form.salary ? parseFloat(form.salary) : 0,
      // status/hire_date left unchanged unless you want to send them
    };
    try {
      const res = await updateStaff(selected.id, payload);
      setStaff((prev) => prev.map((p) => (p.id === selected.id ? res.data : p)));
      setDialog({ open: false, mode: null });
      setSelected(null);
      setForm(emptyForm);
      toast.success("Staff updated");
    } catch (err) {
      console.error("Update staff error:", err);
      toast.error("Failed to update staff");
    }
  };

  // Delete staff
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      await deleteStaff(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      toast.success("Staff deleted");
    } catch (err) {
      console.error("Delete staff error:", err);
      toast.error("Failed to delete staff");
    }
  };

  // Toggle status (active/inactive)
  const handleToggleStatus = async (s) => {
    try {
      const newStatus = s.status === "active" ? "inactive" : "active";
      // Use patch so we don't have to send whole object
      const res = await apiClient.patch(`/staff/${s.id}/`, { status: newStatus });
      setStaff((prev) => prev.map((p) => (p.id === s.id ? res.data : p)));
      toast.success("Status updated");
    } catch (err) {
      console.error("Status toggle error:", err);
      toast.error("Failed to update status");
    }
  };

  // Dialog open handlers
  const openAddDialog = () => {
    setForm(emptyForm);
    setSelected(null);
    setDialog({ open: true, mode: "add" });
  };

  // Loading / error UI
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box p={4} maxWidth="1200px" mx="auto">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <People color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Staff Management
            </Typography>
            <Typography color="text.secondary">Manage your team members</Typography>
          </Box>
        </Box>

        <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
          Add Staff
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Staff</Typography>
              <Typography variant="h5">{totalStaff}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Active Staff</Typography>
              <Typography variant="h5" color="success.main">
                {activeStaff}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Payroll</Typography>
              <Typography variant="h5">${totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={3} alignItems="center">
        <TextField
          sx={{ minWidth: 280 }}
          label="Search staff"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Role">
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="cashier">Cashier</MenuItem>
            <MenuItem value="inventory_manager">Inventory Manager</MenuItem>
            <MenuItem value="sales_associate">Sales Associate</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Card>
        <CardHeader title={`Staff List (${filtered.length})`} />
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Hire Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar>{(s.name || "U").charAt(0)}</Avatar>
                      <Typography>{s.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{(s.role || "").replace("_", " ")}</TableCell>
                  <TableCell>{s.department || "General"}</TableCell>
                  <TableCell>{formatDate(s.hire_date || s.hireDate)}</TableCell>
                  <TableCell>
                    <Chip label={s.status} color={s.status === "active" ? "success" : "default"} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => { setSelected(s); setDialog({ open: true, mode: "view" }); }}>
                      <Visibility />
                    </IconButton>
                    <IconButton onClick={() => openEdit(s)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleToggleStatus(s)}>
                      {s.status === "active" ? <PersonOff /> : <Person />}
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(s.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No staff found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: null })} maxWidth="sm" fullWidth>
        {dialog.mode === "add" && (
          <>
            <DialogTitle>Add Staff</DialogTitle>
            <DialogContent dividers>
              <TextField fullWidth margin="dense" label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField fullWidth margin="dense" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField fullWidth margin="dense" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField fullWidth margin="dense" label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <TextField fullWidth margin="dense" label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <TextField fullWidth margin="dense" label="Salary" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false, mode: null })}>Cancel</Button>
              <Button variant="contained" onClick={handleAdd}>Add</Button>
            </DialogActions>
          </>
        )}

        {dialog.mode === "edit" && (
          <>
            <DialogTitle>Edit Staff</DialogTitle>
            <DialogContent dividers>
              <TextField fullWidth margin="dense" label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField fullWidth margin="dense" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField fullWidth margin="dense" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField fullWidth margin="dense" label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <TextField fullWidth margin="dense" label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <TextField fullWidth margin="dense" label="Salary" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false, mode: null })}>Cancel</Button>
              <Button variant="contained" onClick={handleEdit}>Save</Button>
            </DialogActions>
          </>
        )}

        {dialog.mode === "view" && selected && (
          <>
            <DialogTitle>View Staff</DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6">{selected.name}</Typography>
              <Typography color="text.secondary">{selected.email}</Typography>
              <Box mt={2}>
                <Typography>Phone: {selected.phone}</Typography>
                <Typography>Department: {selected.department}</Typography>
                <Typography>Role: {selected.role}</Typography>
                <Typography>Hire Date: {formatDate(selected.hire_date || selected.hireDate)}</Typography>
                <Typography>Salary: ${Number(selected.salary || 0).toLocaleString()}</Typography>
                <Typography>Status: {selected.status}</Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false, mode: null })}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
