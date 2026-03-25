import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Divider,
  TextField,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import {
  ShoppingCart,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import apiClient, { getProducts, getStaff } from "../api/apiClient";

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const TAX_RATE = 0.075; // 7.5% VAT

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, staffRes] = await Promise.all([getProducts(), getStaff()]);
        setProducts(prodRes.data || []);
        setStaffList(staffRes.data || []);
        const storedStaff = localStorage.getItem("staff_id");
        if (storedStaff) setSelectedStaffId(Number(storedStaff));
      } catch (err) {
        toast.error("Failed to load products or staff");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const addToCart = (product) => {
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) {
      setCart((prev) =>
        prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart((prev) => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((c) => (c.product.id === productId ? { ...c, quantity: newQty } : c))
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    const payload = {
      items: cart.map((c) => ({
        product_id: c.product.id,
        quantity: c.quantity,
      })),
      payment_method: paymentMethod,
      staff_id: selectedStaffId,
    };

    try {
      const res = await apiClient.post("/transactions/create_sale/", payload);
      toast.success("Sale processed successfully");
      setReceiptData(res.data);
      setReceiptOpen(true);
      clearCart();
      setCheckoutOpen(false);

      // Optional: auto-print after 1 second
      setTimeout(() => window.print(), 1000);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Checkout failed. Please try again.";
      toast.error(msg);
    }
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          px: 3,
          py: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <ShoppingCart />
          <Typography variant="h5" fontWeight={600}>
            POS Terminal
          </Typography>
        </Box>
        <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
      </Box>

      <Grid container spacing={2} sx={{ flex: 1, p: 2 }}>
        {/* Products */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: "100%", overflowY: "auto" }}>
            <TextField
              fullWidth
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {loading ? (
              <Typography>Loading products...</Typography>
            ) : (
              <Grid container spacing={2}>
                {filteredProducts.map((p) => (
                  <Grid item xs={6} sm={4} md={3} key={p.id}>
                    <Card
                      onClick={() => addToCart(p)}
                      sx={{
                        p: 2,
                        textAlign: "center",
                        cursor: "pointer",
                        "&:hover": { boxShadow: 3, bgcolor: "grey.50" },
                      }}
                    >
                      <Typography fontWeight={600}>{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${p.price}
                      </Typography>
                      <Typography variant="caption">
                        Stock: {p.quantity ?? "-"}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Cart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6">Cart</Typography>
            <Divider sx={{ my: 1 }} />

            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {cart.length === 0 ? (
                <Typography color="text.secondary">Cart is empty</Typography>
              ) : (
                cart.map((c) => (
                  <Box
                    key={c.product.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    my={1}
                  >
                    <Box>
                      <Typography>{c.product.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${c.product.price} × {c.quantity}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(c.product.id, c.quantity - 1)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography>{c.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(c.product.id, c.quantity + 1)}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFromCart(c.product.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                ))
              )}
            </Box>

            <Divider sx={{ my: 1 }} />
            <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
            <Typography>Tax: ${tax.toFixed(2)}</Typography>
            <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Staff</InputLabel>
              <Select
                value={selectedStaffId ?? ""}
                label="Staff"
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                {staffList.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Payment</InputLabel>
              <Select
                value={paymentMethod}
                label="Payment"
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="MOBILE">Mobile</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} mt={2}>
              <Button
                variant="outlined"
                color="error"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={() => setCheckoutOpen(true)}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
          <Typography>Tax: ${tax.toFixed(2)}</Typography>
          <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCheckout}>
            Confirm & Pay
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onClose={() => setReceiptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Receipt</DialogTitle>
        <DialogContent>
          <Box id="receipt-content" sx={{ p: 2 }}>
            <Typography align="center" variant="h6" gutterBottom>
              🏪 My Inventory POS
            </Typography>
            <Typography variant="body2" align="center">
              Transaction: {receiptData?.transaction_id || "N/A"}
            </Typography>
            <Divider sx={{ my: 1 }} />
            {receiptData?.items?.map((item, i) => (
              <Box key={i} display="flex" justifyContent="space-between">
                <Typography>{item.product_name}</Typography>
                <Typography>
                  {item.quantity} × ${item.price_at_time_of_sale}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
            <Typography>Tax: ${tax.toFixed(2)}</Typography>
            <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
            <Typography align="center" variant="body2" mt={2}>
              Payment: {paymentMethod}
            </Typography>
            <Typography align="center" variant="caption">
              Thank you for your purchase!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button onClick={() => setReceiptOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
