"use client";

import React, { useState, useEffect } from "react";
import "./CatelogingShare.scss";
import { CommonAPImain } from "@/Utils/API/CommonAPImain/CommonAPImain";
import { newCustomerAdd } from "@/Utils/API/newCustomerAdd/newCustomerAdd";
import { SendAlbum } from "@/Utils/API/SendAlbum/SendAlbum";
import LoadingBackdrop from "@/Utils/LoadingBackdrop";
import { Box, Button, Menu, MenuItem, Snackbar as MuiSnackbar, Alert, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const CatelogingShareBase = () => {
  const [mode, setMode] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMode(sessionStorage.getItem("catelogsahre") || "");
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [companyTypes, setCompanyTypes] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    companyName: "",
    mobile: "",
    email: "",
    InHelloApp: 1,
  });
  const [errorMessages, setErrorMessages] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [customerData, setCustomerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);

    if (mode === "new") {
      CommonAPImain("GetCompanyType")
        .then((response) => {
          if (response?.Data?.rd) {
            setCompanyTypes(response.Data.rd);
          }
        })
        .finally(() => setIsLoading(false));
    } else if (mode === "share") {
      CommonAPImain("GetCustomerList")
        .then((response) => {
          if (response?.Status === "200") {
            setCustomerData(response.Data.rd);
            setFilteredData(response.Data.rd); // Initially show all customers
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrorMessages((prevErrors) => ({
      ...prevErrors,
      [name]: value ? "" : prevErrors[name],
    }));
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
      setFormData((prevData) => ({
        ...prevData,
        mobile: formatted,
      }));
    }

    setErrorMessages((prevErrors) => ({
      ...prevErrors,
      mobile: value ? "" : prevErrors.mobile,
    }));
  };

  const handleSubmit = () => {
    let valid = true;

    let errors = {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
    };

    if (!formData.firstName) {
      errors.firstName = "First Name is required!";
      valid = false;
    }

    if (!formData.lastName) {
      errors.lastName = "Last Name is required!";
      valid = false;
    }

    if (!formData.mobile) {
      errors.mobile = "Mobile Number is required!";
      valid = false;
    }

    if (!formData.email) {
      errors.email = "Email Id is required!";
      valid = false;
    }

    if (!valid) {
      setErrorMessages(errors);
      return;
    }

    setErrorMessages({});
    const Id =
      typeof window !== "undefined"
        ? sessionStorage.getItem("catelogAlbumMasterID")
        : null;

    setIsLoading(true);
    newCustomerAdd(
      "Catelog_SendAlbum_NewCustomer",
      Id,
      formData?.firstName ?? "",
      formData?.lastName ?? "",
      formData?.city ?? "",
      formData?.companyName ?? "",
      formData?.mobile ?? "",
      formData?.email ?? "",
      formData?.companyTypeId ?? "",
      formData?.companyTypeName ?? "",
      formData?.InHelloApp ?? 1
    )
      .then((response) => {
        if (response?.Data?.[0]?.rd?.[0]?.Msg === "mobileexists") {
          setSnackbarErrorOpen(true);
          setTimeout(() => {
            setSnackbarErrorOpen(false);
          }, 3000);
        } else {
          setSnackbarOpen(true);
          setFormData({
            firstName: "",
            lastName: "",
            city: "",
            companyName: "",
            mobile: "",
            email: "",
            InHelloApp: 1,
          });
          setTimeout(() => {
            setSnackbarOpen(false);
            router.push("/cateloging");
          }, 3000);
        }
      })
      .finally(() => setIsLoading(false));
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCompanyTypeSelect = (companyType) => {
    setFormData({
      ...formData,
      companyTypeId: companyType.CompanyTypeId,
      companyTypeName: companyType.CompanyTypeName,
    });
    handleMenuClose();
  };

  const handleCheckboxChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      InHelloApp: e.target.checked ? 1 : 0,
    }));
  };

  const normalize = (val) =>
    (val || "")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value) {
      const searchValue = normalize(value);

      const filtered = customerData.filter((customer) => {
        return (
          normalize(customer.UserId).includes(searchValue) ||
          normalize(customer.CustomerCode).includes(searchValue) ||
          normalize(customer.FLname).includes(searchValue) ||
          normalize(customer.Firmname).includes(searchValue) ||
          normalize(customer.Firstname).includes(searchValue) ||
          normalize(customer.Lastname).includes(searchValue) ||
          normalize(customer.mobileno).includes(searchValue)
        );
      });

      setFilteredData(filtered);
    } else {
      setFilteredData(customerData);
    }
  };

  const handleSelectCustomerFromList = (userId, customer) => {
    setSelectedUserId(userId);
    setSearchTerm(customer?.Firmname);
  };

  const handleSaveCustomer = () => {
    if (selectedUserId) {
      const customer = customerData.find(
        (c) => c.UserId.toLowerCase() === selectedUserId.toLowerCase()
      );
      if (customer) {
        setSelectedCustomers([customer]);
        setSelectedUserId("");
      }
      setSearchTerm("");
    }
  };

  const handleDeleteCustomer = (customerId) => {
    setSelectedCustomers(
      selectedCustomers.filter((customer) => customer.CustomerId !== customerId)
    );
  };

  const handleSend = () => {
    setIsLoading(true);
    const Id =
      typeof window !== "undefined"
        ? sessionStorage.getItem("catelogAlbumMasterID")
        : null;

    SendAlbum(
      "Catelog_SendAlbum",
      Id ?? "",
      selectedCustomers[0]?.CustomerId ?? ""
    ).then((response) => {
      if (response) {
        setSnackbarOpen(true);
        setTimeout(() => {
          setSnackbarOpen(false);
          router.push("/cateloging");
        }, 3000);
      }
    }).finally(() => setIsLoading(false));
  };

  return (
    <div>
      <LoadingBackdrop isLoading={isLoading} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, bgcolor: 'white' }}>
        <Box
          onClick={() => router.back()}
          sx={{
            width: 36, height: 36, borderRadius: '50%', bgcolor: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 6px rgba(124,58,237,0.1)', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            '&:active': { transform: 'scale(0.9)' }, transition: 'transform 0.15s',
          }}
        >
          <ArrowLeft size={20} color="#1F2937" />
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
          Catalog Share
        </Typography>
      </Box>
      {mode === "share" && (
        <div>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', px: 2, py: 1.5, bgcolor: 'white' }}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: '#fff',
                borderRadius: 3,
                px: 1.5,
                py: 1.25,
                border: '1.5px solid #E5E7EB',
                boxShadow: '0 1px 8px rgba(124,58,237,0.05)',
                '&:focus-within': { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,0.1)' },
                transition: 'all 0.15s',
              }}
            >
              <Search size={17} color="#9CA3AF" strokeWidth={2.2} />
              <Box
                component="input"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search Customer"
                sx={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: '#1F2937',
                  bgcolor: 'transparent',
                  fontFamily: 'inherit',
                  '&::placeholder': { color: '#C4C9D4' },
                }}
              />
              {searchTerm && (
                <Box onClick={() => setSearchTerm('')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={14} color="#9CA3AF" />
                </Box>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={handleSaveCustomer}
              sx={{
                bgcolor: '#7C3AED', color: '#fff', textTransform: 'none', borderRadius: 2, px: 2,
                '&:hover': { bgcolor: '#6D28D9' },
              }}
            >
              Save
            </Button>
          </Box>

          {selectedCustomers.length > 0 && (
            <div className="selected-customers">
              <h4>Selected Customer</h4>
              <ul>
                {selectedCustomers.map((customer) => (
                  <li key={customer.CustomerId}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600 }}>
                        {customer.Firstname} {customer.Lastname} (
                        {customer.CustomerCode})
                      </span>
                      <span style={{ fontSize: "13px" }}>{customer.email1}</span>
                      <span style={{ fontSize: "13px" }}>{customer.mobileno}</span>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteCustomer(customer.CustomerId)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              <Button onClick={handleSend} className="catelog_save_btn">
                Send
              </Button>
            </div>
          )}

          {filteredData.length > 0 && (
            <Box sx={{ px: 2, mb: 8 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937', mb: 1 }}>
                Customer List
              </Typography>
              <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: 2, p: 1, maxHeight: 320, overflow: 'auto' }}>
                {filteredData.map((customer) => (
                  <Box
                    key={customer.CustomerId}
                    onClick={() => handleSelectCustomerFromList(customer.UserId, customer)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.25,
                      mb: 1,
                      border: '1px solid #E5E7EB',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#F3F4F6' },
                      '&:active': { transform: 'scale(0.98)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                        {customer?.TypoLabel}
                      </Typography>
                      {customer?.mobileno && (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {customer.mobileno}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                      Select
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </div>
      )}

      {mode === "new" && (
        <Box sx={{ px: 2, pt: 1.5, pb: 3, bgcolor: 'white', minHeight: '60vh' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937', mb: 2 }}>
            Add New Customer
          </Typography>

          <TextField
            fullWidth
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            size="small"
            variant="outlined"
            label="First Name"
            placeholder="e.g. John"
            required
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {errorMessages.firstName && (
            <p className="error-message">{errorMessages.firstName}</p>
          )}

          <TextField
            fullWidth
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            size="small"
            variant="outlined"
            label="Last Name"
            placeholder="e.g. Doe"
            required
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {errorMessages.lastName && (
            <p className="error-message">{errorMessages.lastName}</p>
          )}

          <TextField
            fullWidth
            name="city"
            value={formData.city}
            onChange={handleChange}
            size="small"
            variant="outlined"
            label="City"
            placeholder="e.g. Surat"
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            size="small"
            variant="outlined"
            label="Company Name"
            placeholder="e.g. Optigo"
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            name="mobile"
            value={formData.mobile}
            onChange={handleMobileChange}
            size="small"
            variant="outlined"
            label="Mobile"
            placeholder="000-000-0000"
            required
            inputProps={{
              maxLength: 12,
              type: "tel",
            }}
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {errorMessages.mobile && (
            <p className="error-message">{errorMessages.mobile}</p>
          )}

          <TextField
            fullWidth
            name="email"
            value={formData.email}
            onChange={handleChange}
            size="small"
            variant="outlined"
            label="Email"
            placeholder="john@example.com"
            inputProps={{
              type: "email",
            }}
            required
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {errorMessages.email && (
            <p className="error-message">{errorMessages.email}</p>
          )}

          <TextField
            fullWidth
            name="companyType"
            value={formData.companyTypeName || ""}
            size="small"
            variant="outlined"
            label="Company Type"
            placeholder="Select type"
            required
            onClick={handleMenuOpen}
            inputProps={{
              readOnly: true,
            }}
            sx={{ mb: 1.5, bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              style: {
                maxHeight: 300,
                width: "100%",
              },
            }}
          >
            {companyTypes.map((companyType) => (
              <MenuItem
                key={companyType.CompanyTypeId}
                onClick={() => {
                  handleCompanyTypeSelect(companyType);
                  setAnchorEl(null);
                }}
              >
                {companyType.CompanyTypeName}
              </MenuItem>
            ))}
          </Menu>
          {errorMessages.companyType && (
            <p className="error-message">{errorMessages.companyType}</p>
          )}

          <Button
            fullWidth
            onClick={handleSubmit}
            sx={{
              py: 1.75,
              bgcolor: '#7C3AED',
              color: '#fff',
              borderRadius: 3,
              fontSize: 15,
              fontWeight: 600,
              '&:hover': { bgcolor: '#5B21B6' },
              mt: 1,
            }}
          >
            Submit
          </Button>
        </Box>
      )}

      <MuiSnackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Send Album Successfully!
        </Alert>
      </MuiSnackbar>

      <MuiSnackbar
        open={snackbarErrorOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarErrorOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          Mobile Number Exists
        </Alert>
      </MuiSnackbar>
    </div>
  );
};

export default CatelogingShareBase;