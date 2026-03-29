// src/components/AddItemPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl, // Keep this for Supplier/Location if using Select
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  // Remove IconButton if not needed elsewhere
} from '@mui/material';
// Import the Autocomplete component from MUI Lab
import Autocomplete from '@mui/lab/Autocomplete'; 
import { Add as  Upload, Download } from '@mui/icons-material';
// Import necessary API functions
import { createProduct, getCategories, getSuppliers, getLocations, } from '../api/apiClient';
import { toast } from 'sonner';

const AddItemPage = () => {
  const [tab, setTab] = useState("manual"); // "manual" or "csv"

  const [formData, setFormData] = useState({
    name: "",
    category: null, // Holds the *selected* category object or *finalized* string name
    price: "",
    quantity: "",
    reorder_level: "",
    description: "",
    supplier: "", // Will hold the Supplier ID (integer)
    location: 1, // Will hold the Location ID (integer), defaulting to 1
    expiry_date: "", // Optional field
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // State for fetched data
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);

  // State for Autocomplete
  const [inputValue, setInputValue] = useState(''); // Holds the text typed by the user in the Autocomplete
  const [options, setOptions] = useState([]); // Holds the options displayed in the Autocomplete dropdown
  const [ setGeneratedResult] = useState(null);

  // Fetch categories, suppliers, and locations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, suppliersRes, locationsRes] = await Promise.all([
          getCategories(),
          getSuppliers(),
          getLocations()
        ]);

        const fetchedCategories = categoriesRes.data.results || categoriesRes.data;
        setCategories(fetchedCategories);
        setOptions(fetchedCategories); // Initially, options are the same as categories
        setSuppliers(suppliersRes.data.results || suppliersRes.data);
        setLocations(locationsRes.data.results || locationsRes.data);

      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data.");
      }
    };

    fetchData();
  }, []);

  // Update Autocomplete options based on user input
  useEffect(() => {
    let filtered = categories;
    if (inputValue) {
      filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(inputValue.toLowerCase())
      );
    }
    // console.log("Autocomplete options updated:", filtered); // <-- DEBUG: Check options filtering
    setOptions(filtered);
  }, [inputValue, categories]);

  // Specific handler for Select components (Supplier, Location) to ensure integer IDs are stored
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'supplier' || name === 'location' ? parseInt(value, 10) : value,
    }));
  };

  // Specific handler for Autocomplete change (Category)
  const handleCategoryChange = (event, value, reason) => {
    console.log("handleCategoryChange called:", { value, reason }); // <-- DEBUG: Log change event
    // 'value' can be null, an object (selected option), or a string (typed value if freeSolo finalized)
    // 'reason' tells us how the change happened (e.g., 'selectOption', 'input', 'clear')

    if (reason === 'selectOption' && value && typeof value === 'object') {
      // User selected an existing category from the list
      setFormData(prev => ({ ...prev, category: value })); // Store the full category object
      setInputValue(value.name); // Update inputValue to display the selected category's name
    } else if (reason === 'clear') {
       // User cleared the field
       setFormData(prev => ({ ...prev, category: null }));
       setInputValue(''); // Clear the input display
    }
    // Note: We are NOT handling 'input' reason here anymore for finalizing the value.
    // The finalization will happen in handleAddProduct if needed.
  };

  // Specific handler for Autocomplete input change (typing)
  const handleCategoryInputChange = (event, newInputValue, reason) => {
    console.log("handleCategoryInputChange called:", { newInputValue, reason }); // <-- DEBUG: Log input change
    // Update the inputValue state which is used for filtering options and the input display
    setInputValue(newInputValue);
    // DO NOT update formData.category here yet, just the display/input value state
    // This line was causing the problem:
    // setFormData(prev => ({ ...prev, category: newInputValue ? newInputValue : null })); // Store string or null
  };

  // General handler for text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'reorder_level' ? parseFloat(value) : name ==='expiry_date' ? value : value,
    }));
  };

  const handleAddProduct = async () => {
  console.log("handleAddProduct called");

  // --- Step 1: Determine final category value ---
  let categoryToUse = formData.category;
  if (!categoryToUse && inputValue.trim()) {
    categoryToUse = inputValue.trim();
    console.log("Using typed value from inputValue as category:", categoryToUse);
  }

  // --- Step 2: Validation ---
  const isNameValid = !!formData.name.trim();
  const isCategoryValid =
    !!categoryToUse &&
    ((typeof categoryToUse === "object" && categoryToUse.name) ||
      (typeof categoryToUse === "string" && categoryToUse.trim() !== ""));
  const isLocationValid = !!formData.location;

  if (!isNameValid || !isCategoryValid || !isLocationValid) {
    toast.error("Please fill all required fields (Name, Category, Location)");
    return;
  }

  setLoading(true);
  try {
    // --- Step 3: Normalize category name ---
    let finalCategoryName = "";
    if (typeof categoryToUse === "object" && categoryToUse.name) {
      finalCategoryName = categoryToUse.name.trim();
    } else if (typeof categoryToUse === "string" && categoryToUse.trim() !== "") {
      finalCategoryName = categoryToUse.trim();
    } else {
      toast.error("Invalid category selected or entered.");
      setLoading(false);
      return;
    }

    // --- Step 4: Prepare final payload (send category name) ---
    const productData = {
      name: formData.name.trim(),
      category: finalCategoryName, // ✅ send name, not ID
      price: parseFloat(formData.price),
      quantity: parseFloat(formData.quantity),
      description: formData.description || "",
      supplier: formData.supplier || null,
      location: formData.location,
      expiry_date: formData.expiry_date || null,
    };

    console.log("Final productData being sent:", productData);

    // --- Step 5: Send to backend ---
    const response = await createProduct(productData);
    console.log("Product created successfully:", response.data);

    const { sku, barcode_image } = response.data;
    setGeneratedResult({ sku, barcode_image });

    toast.success(`${formData.name} added successfully! SKU: ${sku}`);

    // --- Step 6: Reset form ---
    setFormData({
      name: "",
      category: null,
      price: "",
      quantity: "",
      reorder_level: "",
      description: "",
      expiry_date: "",
      supplier: "",
      location: locations.length > 0 ? locations[0].id : 1,
    });
    setInputValue("");
  } catch (err) {
    console.error("Error adding product:", err);
    const errorMessage =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      "Failed to add product.";
    toast.error(errorMessage);
    setSnackbar({ open: true, message: errorMessage, severity: "error" });
  } finally {
    setLoading(false);
  }
};

  // Placeholder for CSV handling (you'd need a library like papaparse)
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("CSV file selected:", file.name);
      // Implement CSV parsing and batch API calls here
      // toast.success(`CSV ${file.name} selected. Parsing and uploading...`); // Placeholder
    }
  };

  const handleDownloadTemplate = () => {
    // Create a simple CSV template as a string
    const csvContent = "text/csv;charset=utf-8," +
      "Name,SKU,Category,Price,Description,Supplier\n" +
      "Example Product,EP-001,Electronics,19.99,An example product,Supplier A\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Add New Item
      </Typography>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, val) => setTab(val)}>
        <Tab label="Manual Entry" value="manual" />
        <Tab label="Bulk Import (CSV)" value="csv" />
      </Tabs>

      {tab === "manual" && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Product Name *"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      {/* Replace Select with Autocomplete for Category */}
                      <Autocomplete
                        freeSolo // Allows typing new values not in the list
                        value={formData.category} // Represents the selected/finalized category (object or string)
                        inputValue={inputValue} // Represents the current input text
                        onInputChange={handleCategoryInputChange} // Handles typing in the input field
                        onChange={handleCategoryChange} // Handles selection or finalization of input
                        options={options} // The list of categories to show
                        getOptionLabel={(option) => option?.name || ""} // How to display an option, handle null
                        isOptionEqualToValue={(option, value) => option?.id === value?.id} // How to match selected value to option, handle null
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Category *" // Label for the Autocomplete
                            variant="outlined"
                            required // Make it required
                          />
                        )}
                        // Optional: Add loading indicator if fetching options dynamically
                        // loading={loadingCategories}
                        // loadingText="Loading categories..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Price *"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        variant="outlined"
                        InputProps={{ inputProps: { step: 0.01 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Initial Quantity"
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Reorder Level"
                        name="reorder_level"
                        type="number"
                        value={formData.reorder_level}
                        onChange={handleInputChange}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <TextField
                        fullWidth
                        label="Expiry Date"
                        name="expiry_date"
                        type="datetime-local" // Use datetime-local for date/time input
                        value={formData.expiry_date} // Bind to state
                        onChange={handleInputChange} // Use the general handler
                        variant="outlined"
                        InputLabelProps={{
                          shrink: true, // Ensures the label doesn't overlap the selected date
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined">
                        <select // Use a regular Select for Supplier for now
                          name="supplier"
                          value={formData.supplier || ''} // Handle potential empty string
                          onChange={handleSelectChange}
                          label="Supplier"
                        >
                          <option value="">Select Supplier</option>
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined">
                        <select // Use a regular Select for Location for now
                          name="location"
                          value={formData.location || 1} // Handle potential empty string, default to 1
                          onChange={handleSelectChange}
                          label="Location"
                        >
                          <option value="">Select Location</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
                      onClick={handleAddProduct}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Product'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    - Fields marked with * are required.<br />
                    - SKU must be unique.<br />
                    - Price should be a number (e.g., 19.99).<br />
                    - Initial quantity will be added to the selected location.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {tab === "csv" && (
        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bulk Import via CSV
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Download the template, fill it with your product data, and upload it here.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
                <Button
                  variant="contained"
                  component="label" // Makes the Button behave like a label for the hidden input
                >
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleCsvUpload} // Use the placeholder function
                  />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Snackbar for errors (optional, toast is used above) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddItemPage;