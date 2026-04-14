// src/components/AuthPage.js
import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/apiClient';
import { toast } from 'sonner';

const AuthPage = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    shift: '',
    phone_number: '',
    role: 'staff', // ✅ default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -----------------------
  // Handlers
  // -----------------------
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  // -----------------------
  // Login
  // -----------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginData.username || !loginData.password) {
      const msg = 'Username and password are required.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const response = await login(loginData);
      console.log('Login response:', response.data);

      const { access, refresh, role, staff_details } = response.data;

      const user = {
        id: staff_details.id || null,
        username: staff_details.username,
        role: staff_details?.role || role, // fallback to role from token if not in details
        name: staff_details?.name,
      };

      // ✅ Save tokens and role
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role); // for quick access in layout

      toast.success('Login successful!');

      // ✅ Redirect by role
      if (role === 'manager') navigate('/', { replace: true });
      else navigate('/pos', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Login failed';
      if (err.response)
        msg =
          err.response.data?.error ||
          err.response.data?.detail ||
          `Server Error: ${err.response.status}`;
      else if (err.request)
        msg = 'Network error or server not responding.';
      else msg = `Request setup error: ${err.message}`;

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // Signup
  // -----------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { username, email, password, name } = signupData;
    if (!username || !email || !password || !name) {
      const msg = 'Username, email, password, and name are required.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const response = await register(signupData);
      console.log('Signup response:', response.data);
      toast.success('User registered successfully! Please log in.');

      // ✅ Switch to login tab automatically
      setTab('login');
      setLoginData({
        username: signupData.username,
        password: signupData.password,
      });
    } catch (err) {
      console.error('Signup error:', err);
      let msg = 'Registration failed';
      if (err.response)
        msg =
          err.response.data?.error ||
          err.response.data?.detail ||
          `Server Error: ${err.response.status}`;
      else if (err.request)
        msg = 'Network error or server not responding.';
      else msg = `Request setup error: ${err.message}`;

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Inventory App
          </Typography>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
            <Tab label="Login" value="login" />
            <Tab label="Sign Up" value="signup" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Box>
          )}

          {/* SIGNUP FORM */}
          {tab === 'signup' && (
            <Box component="form" onSubmit={handleSignup} sx={{ mt: 2 }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="signup-username"
                label="Username"
                name="username"
                value={signupData.username}
                onChange={handleSignupChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="signup-email"
                label="Email Address"
                name="email"
                type="email"
                value={signupData.email}
                onChange={handleSignupChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="signup-name"
                label="Full Name"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="signup-shift"
                label="Shift"
                name="shift"
                value={signupData.shift}
                onChange={handleSignupChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="signup-phone"
                label="Phone Number"
                name="phone_number"
                value={signupData.phone_number}
                onChange={handleSignupChange}
              />

              {/* ✅ ROLE SELECTION */}
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={signupData.role}
                  onChange={handleSignupChange}
                >
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="signup-password"
                value={signupData.password}
                onChange={handleSignupChange}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthPage;
