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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  LocalShipping as TruckIcon,
  Inventory2 as PackageIcon,
  Star as StarIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import apiClient, { getSuppliers } from "../api/apiClient";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  // const [isViewOpen, setIsViewOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuSupplierId, setMenuSupplierId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const emptyForm = { name: "", company_name: "",brand_name:"", email: "", phone_number: "", address: "", products_supplied: [], tempProduct: "", };
  const [formData, setFormData] = useState(emptyForm);

  /* ---------- Fetch Suppliers from Backend ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getSuppliers();
        setSuppliers(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load suppliers.");
        toast.error("Failed to fetch suppliers.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ---------- CRUD Actions ---------- */
  const handleAddSupplier = async () => {
    try {
      const payload = {
        ...formData,
        products_supplied: Array.isArray(formData.products_supplied)
          ? formData.products_supplied.join(", ")
          : formData.products_supplied,
      };

      const response = await apiClient.post("/suppliers/", payload);
      setSuppliers((prev) => [...prev, response.data]);
      setIsAddOpen(false);
      toast.success("Supplier added successfully!");
      setFormData(emptyForm);
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to add supplier.");
    }
  };


  const handleEditSupplier = async () => {
    try {
      const payload = {
        ...formData,
        products_supplied: Array.isArray(selectedSupplier.products_supplied)
          ? formData.products_supplied.join(", ")
          : formData.products_supplied,
      };

      const response = await apiClient.put(`/suppliers/${selectedSupplier.id}/`, payload);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === selectedSupplier.id ? response.data : s))
      );
      setIsEditOpen(false);
      toast.success("Supplier updated successfully!");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to update supplier.");
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await apiClient.delete(`/suppliers/${id}/`);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier deleted!");
      closeMenu();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete supplier.");
    }
  };

  

  /* ---------- Helpers ---------- */
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalSuppliers = suppliers.length;
  // const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalProducts = suppliers.reduce((sum, s) => sum + ((s.products_supplied?.length) || 0), 0);
  const avgRating =
    suppliers.length > 0
      ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)
      : 0;

  const openMenu = (e, id) => {
    setAnchorEl(e.currentTarget);
    setMenuSupplierId(id);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setMenuSupplierId(null);
  };

  const openEditDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      company_name: supplier.company_name,
      brand_name: supplier.brand_name,
      email: supplier.email,
      phone_number: supplier.phone_number,
      address: supplier.address,
      products_supplied: Array.isArray(supplier.products_supplied)
      ? supplier.products_supplied
      : supplier.products_supplied
      ? supplier.products_supplied.split(",").map((p) => p.trim())
      : [],
      tempProduct: "",
    });
    setIsEditOpen(true);
  };

  // const formatDate = (date) =>
    // date ? new Date(date).toLocaleDateString("en-US") : "N/A";

  /* ---------- Loading/Error States ---------- */
  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );

  /* ---------- UI ---------- */
  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <TruckIcon fontSize="large" color="primary" />
          <Box>
            <Typography variant="h4" fontWeight="700">
              Suppliers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your suppliers and products
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddOpen(true)}
        >
          Add Supplier
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ maxWidth: 1200, mx: "auto", mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Total Suppliers" />
            <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h5">{totalSuppliers}</Typography>
              <TruckIcon />
            </CardContent>
          </Card>
        </Grid>
       
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Products Supplied" />
            <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h5">{totalProducts}</Typography>
              <PackageIcon />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Avg. Rating" />
            <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h5">{avgRating}</Typography>
              <StarIcon sx={{ color: "warning.main" }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "40%" }}
        />
        <Box display="flex" gap={1}>
          <Button
            variant={filterStatus === "all" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          
        </Box>
      </Box>

      {/* Supplier Table */}
      <Card sx={{ maxWidth: 1200, mx: "auto" }}>
        <CardHeader title="Supplier List" />
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Products Supplied</TableCell>
              
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.brand_name || "_"}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone_number}</TableCell>
                  <TableCell>{s.address || "_"}</TableCell>
                  <TableCell>
                    {(() => {
                      // Normalize: convert string like "milk, yoghurt" into an array
                      const products = Array.isArray(s.products_supplied)
                        ? s.products_supplied
                        : typeof s.products_supplied === "string" && s.products_supplied.trim() !== ""
                        ? s.products_supplied.split(",").map((p) => p.trim())
                        : [];

                      return products.length > 0 ? (
                        products.map((p, i) => (
                          <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                      );
                    })()}
                  </TableCell>
                 
                  <TableCell>
                    <IconButton onClick={(e) => openMenu(e, s.id)}>
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl) && menuSupplierId === s.id}
                      onClose={closeMenu}
                    >
                      <MenuItem onClick={() => openEditDialog(s)}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                      </MenuItem>
                      
                   
                      <MenuItem onClick={() => handleDeleteSupplier(s.id)}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Supplier</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="dense"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Company"
            margin="dense"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Brand Name"
            margin="dense"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Email"
            margin="dense"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Phone Number"
            margin="dense"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          />
          <TextField
            fullWidth
            label="Address"
            margin="dense"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
           <Box mt={2}>
            <Typography variant="subtitle2">Products Supplied</Typography>

            <Box display="flex" gap={1} alignItems="center" mt={1}>
              <TextField
                fullWidth
                placeholder="Enter product name (e.g., Pen, Table Water)"
                value={formData.tempProduct || ""}
                onChange={(e) => setFormData({ ...formData, tempProduct: e.target.value })}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (!formData.tempProduct) return toast.error("Enter a product name first");
                  setFormData({
                    ...formData,
                    products_supplied: [...(formData.products_supplied || []), formData.tempProduct],
                    tempProduct: "",
                  });
                }}
              >
                Add
              </Button>
            </Box>

            {/* Display added products */}
            <Box mt={1}>
              {(formData.products_supplied || []).map((prod, index) => (
                <Chip
                  key={index}
                  label={prod}
                  onDelete={() =>
                    setFormData({
                      ...formData,
                      products_supplied: formData.products_supplied.filter((_, i) => i !== index),
                    })
                  }
                  color="primary"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSupplier}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Supplier</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="dense"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

           <TextField
            fullWidth
            label="Brand Name"
            margin="dense"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
          />

          <TextField
            fullWidth
            label="Email"
            margin="dense"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Phone Number"
            margin="dense"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          />
          <TextField
            fullWidth
            label="Address"
            margin="dense"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

           <Box mt={2}>
              <Typography variant="subtitle2">Products Supplied</Typography>

              <Box display="flex" gap={1} alignItems="center" mt={1}>
                <TextField
                  fullWidth
                  placeholder="Enter product name (e.g., Pen, Table Water)"
                  value={formData.tempProduct || ""}
                  onChange={(e) => setFormData({ ...formData, tempProduct: e.target.value })}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (!formData.tempProduct) return toast.error("Enter a product name first");
                    setFormData({
                      ...formData,
                      products_supplied: [...(formData.products_supplied || []), formData.tempProduct],
                      tempProduct: "",
                    });
                  }}
                >
                  Add
                </Button>
              </Box>

              {/* Show existing products */}
              <Box mt={1}>
                {(formData.products_supplied || []).map((prod, index) => (
                  <Chip
                    key={index}
                    label={prod}
                    onDelete={() =>
                      setFormData({
                        ...formData,
                        products_supplied: formData.products_supplied.filter((_, i) => i !== index),
                      })
                    }
                    color="primary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSupplier}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
