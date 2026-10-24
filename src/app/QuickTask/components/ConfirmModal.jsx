import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import { useStore } from "../context/useTasks";

const ConfirmationModal = ({ msg = ` This action will permanently delete the data. Are you sure you want to proceed?` }) => {
  const { open, handleClose, handleConfirm } = useStore();
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-confirmation-title"
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: 400,
            m: 2,
            borderRadius: "16px",
            bgcolor: "#f9f9f9",
            p: 2,
            boxShadow: "0px 10px 25px rgba(0,0,0,0.15)",
          },
        },
      }}
    >
      <DialogTitle
        id="delete-confirmation-title"
        sx={{
          fontSize: "1.3rem",
          fontWeight: 500,
          textAlign: "center",
          color: "#333",
          mb: 1,
          pt: 2,
        }}
      >
        Are you sure?
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: "1.1rem",
            color: "#555",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {msg}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "center", gap: 2 }}>
        <Button
          onClick={handleClose}
          sx={{
            bgcolor: "#f0f0f5",
            color: "#333",
            borderRadius: "12px",
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              bgcolor: "#e5e5ea",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          sx={{
            color: "black",
            borderRadius: "12px",
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
