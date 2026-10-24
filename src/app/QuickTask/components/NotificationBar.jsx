import { Alert, Snackbar } from "@mui/material";
import React from "react";
import { useStore } from "../context/useTasks";

const NotificationBar = () => {
  const { snackbarOpen, setSnackbarOpen, snackbarMessage } = useStore();

  return (
    <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
      <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
        {snackbarMessage}
      </Alert>
    </Snackbar>
  );
};

export default NotificationBar