import React, { useState, useEffect } from "react";
import {
  Box,
  // Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Receipt,
  Search,
  Download,
  // MonetizationOn,
  // ShoppingBag,
  // TrendingUp,
  // Visibility,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { toast } from "sonner";
import { getTransactions } from "../api/apiClient";

export default function SalesHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [openRow, setOpenRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactions();
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load sales history");
      }
    };
    fetchTransactions();
  }, []);

  const filteredSales = transactions.filter((t) => {
    const matchesSearch =
      t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.staff_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // const totalSales = filteredSales.reduce(
  //   (sum, t) => sum + parseFloat(t.total_amount || 0),
  //   0
  // );
  // const totalOrders = filteredSales.length;

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getPaymentColor = (method) => {
    switch (method) {
      case "CASH":
        return "primary";
      case "CARD":
        return "secondary";
      case "MOBILE":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box p={4} maxWidth="1200px" mx="auto">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Receipt color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Sales History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage all transactions
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" onClick={() => toast.success("Exported!")} startIcon={<Download />}>
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
        <TextField
          fullWidth
          label="Search by Order ID or Staff"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "action.active" }} /> }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Sales Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Transactions ({filteredSales.length})
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((t) => (
                <React.Fragment key={t.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setOpenRow(openRow === t.id ? null : t.id)}
                      >
                        {openRow === t.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{t.transaction_id}</TableCell>
                    <TableCell>{formatDate(t.date_time)}</TableCell>
                    <TableCell>{t.staff_name || "—"}</TableCell>
                    <TableCell>${t.total_amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={t.payment_method}
                        color={getPaymentColor(t.payment_method)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.status}
                        color={getStatusColor(t.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>

                  {/* Collapsible Product List */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={openRow === t.id} timeout="auto" unmountOnExit>
                        <Box margin={2}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Products Sold
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell>Qty</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Subtotal</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {t.items && t.items.length > 0 ? (
                                t.items.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell>{item.quantity_sold}</TableCell>
                                    <TableCell>${item.price_at_time_of_sale}</TableCell>
                                    <TableCell>${item.subtotal}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4}>
                                    <em>No products</em>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
