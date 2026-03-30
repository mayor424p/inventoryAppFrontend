import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  WarningAmber,
  MonetizationOn,
  Inventory,
} from "@mui/icons-material";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = "https://inventoryapp-knhf.onrender.com/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch dashboard summary stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          toast.error("Please log in again.");
          return;
        }

        const response = await axios.get(`${API_BASE}/analytics/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired — please log in again.");
        } else {
          toast.error("Failed to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 🔹 Fetch chart data (high/low demand, seasonal)
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await axios.get(`${API_BASE}/analytics/charts/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChartData(response.data);
      } catch (error) {
        console.error("Error loading charts:", error);
      }
    };

    fetchCharts();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Inventory Dashboard
      </Typography>

      {/* ──────── Summary Stats ──────── */}
      <Grid container spacing={3}>
        {/* Weekly Sales */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Weekly Sales</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">${stats.weekly_sales.toFixed(2)}</Typography>
                <TrendingUp color="primary" />
              </Box>
              <Typography variant="body2" color="success.main">
                {stats.weekly_change > 0
                  ? `↑ ${stats.weekly_change}% from last week`
                  : `↓ ${Math.abs(stats.weekly_change)}% from last week`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Sales */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Monthly Sales</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">${stats.monthly_sales.toFixed(2)}</Typography>
                <MonetizationOn color="success" />
              </Box>
              <Typography variant="body2" color="success.main">
                {stats.monthly_change > 0
                  ? `↑ ${stats.monthly_change}% from last month`
                  : `↓ ${Math.abs(stats.monthly_change)}% from last month`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Yearly Sales */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Yearly Sales</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">${stats.yearly_sales.toFixed(2)}</Typography>
                <Inventory color="info" />
              </Box>
              <Typography variant="body2" color="success.main">
                {stats.yearly_change > 0
                  ? `↑ ${stats.yearly_change}% from last year`
                  : `↓ ${Math.abs(stats.yearly_change)}% from last year`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Low Stock Alert</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">{stats.low_stock_count}</Typography>
                <WarningAmber color="warning" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Items need reordering
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ──────── Charts Section ──────── */}
      <Box mt={5}>
        <Typography variant="h6" mb={2}>
          Sales Insights
        </Typography>

        <Grid container spacing={3}>
          {/* High Demand Products */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" mb={2}>
                  High Demand Products
                </Typography>
                {chartData ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.high_demand || []}>
                      <XAxis dataKey="product" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#4caf50" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">Loading chart...</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Low Demand Products */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" mb={2}>
                  Low Demand Products
                </Typography>
                {chartData ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.low_demand || []}>
                      <XAxis dataKey="product" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">Loading chart...</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Seasonal Trends */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" mb={2}>
                  Seasonal Trend
                </Typography>
                {chartData ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData.seasonal || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#2196f3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">Loading chart...</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
