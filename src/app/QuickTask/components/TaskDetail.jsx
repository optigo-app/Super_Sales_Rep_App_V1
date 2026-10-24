import React from "react";
import { Paper, Box, Typography, IconButton, Divider, Chip } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import { format } from "date-fns";
import { FormatDate, getPriorityColor } from "../lib/functions";
import { useStore } from "../context/useTasks";
import { AssignmentInd } from "@mui/icons-material";

const TaskDetail = () => {
  const { selectedTask, setSelectedTask } = useStore();
  if (selectedTask) {
    return (
      <>
        <Box>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" }, // Stack vertically on small screens
                justifyContent: "space-between",
                alignItems: "flex-start", // Align items to the start on column mode
                mb: 2,
                width: "100%",
              }}
            >
              {/* Typography with text wrapping enabled */}
              <Typography
                variant="h6"
                sx={{
                  wordWrap: "break-word", // Allow word wrapping
                  maxWidth: "calc(100% - 48px)", // Ensure space for the icon button in row mode
                  marginBottom: { xs: 1, sm: 0 }, // Add margin at the bottom when in column mode (only on small screens)
                }}
              >
                {selectedTask?.Title}
              </Typography>

              {/* Align IconButton properly with the text */}
              <IconButton size="small" onClick={() => setSelectedTask(null)}>
                <CancelIcon fontSize="medium" />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {selectedTask.Status && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                <Chip label={selectedTask.Status ? selectedTask.Status : "Unassigned"} color={"default"} size="small" />
              </Box>
            )}

            {selectedTask.Priority && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Priority
                </Typography>
                <Chip
                  label={selectedTask.Priority !== "none" ? selectedTask.Priority : "None"}
                  sx={{
                    backgroundColor: getPriorityColor(selectedTask?.Priority),
                    color: "#fff", // Text color to ensure contrast
                  }}
                  size="small"
                />
              </Box>
            )}

            {selectedTask?.DueDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Due Date
                </Typography>
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                  {selectedTask?.DueDate ? format(new Date(selectedTask.DueDate), "MMM d, yyyy h:mm a") : "N/A"}
                </Typography>
              </Box>
            )}

            {selectedTask?.UserName && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assigned By
                </Typography>
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  {selectedTask.UserName}
                </Typography>
              </Box>
            )}

            {selectedTask?.AssignedName && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assigned To
                </Typography>
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                  <AssignmentInd fontSize="small" sx={{ mr: 1 }} /> {/* More relevant icon */}
                  {selectedTask.AssignedName}
                </Typography>
              </Box>
            )}


            {selectedTask.DesignationId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Designation
                </Typography>
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  {selectedTask?.DesignationId}
                </Typography>
              </Box>
            )}

            {selectedTask?.Description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Notes
                </Typography>
                <Typography
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    padding: 1,
                    borderRadius: 2,
                  }}
                  variant="body2"
                >
                  {selectedTask?.Description}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Created
              </Typography>
              <Typography variant="body2">{selectedTask?.EntryDate ? FormatDate(selectedTask.EntryDate) : "N/A"}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2">{selectedTask?.LastUpdateDate ? FormatDate(selectedTask.LastUpdateDate) : "N/A"}</Typography>
            </Box>
          </Paper>
        </Box>
      </>
    );
  }
};

export default TaskDetail;
