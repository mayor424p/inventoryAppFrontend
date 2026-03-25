// src/components/InventoryPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Link,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Upload, Search } from '@mui/icons-material';
import apiClient, { getInventory } from '../api/apiClient';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await getInventory();
        setInventory(response.data.results || response.data);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory.');
        toast.error('Failed to load inventory.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    let result = inventory;

    // Search filter
    if (search) {
      result = result.filter(
        (i) =>
          (i.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
          (i.location_name || '').toLowerCase().includes(search.toLowerCase()) ||
          (i.sku || '').toLowerCase().includes(search.toLowerCase()) ||
          (i.category || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((i) => i.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((i) => {
        const status = i.quantity <= 0 ? 'out-of-stock' : 'in-stock';
        return status === statusFilter;
      });
    }

    setFiltered(result);
  }, [inventory, search, categoryFilter, statusFilter]);

  const handleEdit = (item) => {
    toast.info(`Edit feature coming soon for ${item.product_name}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiClient.delete(`/inventory/${id}/`);
      setInventory(inventory.filter((i) => i.id !== id));
      toast.success('Item deleted successfully!');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete item.');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('This will delete ALL inventory items. Proceed?')) return;
    try {
      await apiClient.delete(`/inventory/delete_all/`);
      setInventory([]);
      toast.success('All items deleted successfully!');
    } catch (err) {
      console.error('Delete all failed:', err);
      toast.error('Failed to delete all items.');
    }
  };

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
  const lowStock = inventory.filter((i) => (i.quantity || 0) <= 0).length;
  const outOfStock = inventory.filter((i) => (i.quantity || 0) <= 0).length;
  const categories = [...new Set(inventory.map((i) => i.category).filter((cat) => cat))];

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">Inventory Management</Typography>
          <Typography color="text.secondary">Manage and track your inventory items</Typography>
        </Box>
        <Link component={RouterLink} to="/add-item" underline="none">
          <Button variant="contained" startIcon={<Upload />}>
            Add New Item
          </Button>
        </Link>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Items</Typography>
              <Typography variant="h5">{totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Value</Typography>
              <Typography variant="h5">${totalValue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Low Stock Alerts</Typography>
              <Typography variant="h5">{lowStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Out of Stock</Typography>
              <Typography variant="h5">{outOfStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Inventory"
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="in-stock">In Stock</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDeleteAll}>
            Delete All
          </Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID (Product)</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((item) => {
              const status = item.quantity <= 0 ? 'out-of-stock' : 'in-stock';
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>${item.price}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        status === 'in-stock'
                          ? 'success.main'
                          : status === 'low-stock'
                          ? 'warning.main'
                          : 'error.main'
                      }
                    >
                      {status.replace('-', ' ').toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.product_expiry_date
                      ? new Date(item.product_expiry_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '_'}
                  </TableCell>
                  <TableCell>{item.last_updated}</TableCell>
                  <TableCell>
                    {item.barcode_image ? (
                      <img
                        src={item.barcode_image}
                        alt={`Barcode for ${item.product_name}`}
                        style={{
                          width: '80px',
                          height: 'auto',
                          border: '1px solid #ddd',
                          padding: '5px',
                          backgroundColor: '#fff',
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Generating...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" color="primary" onClick={() => handleEdit(item)}>
                      <Edit fontSize="small" />
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(item.id)}>
                      <Delete fontSize="small" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          Showing {filtered.length} of {inventory.length} items
        </Typography>
      </Card>
    </Box>
  );
}
