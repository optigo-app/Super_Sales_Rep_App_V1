'use client';  // ← line 1 pe add karo

import { useState, useMemo, useEffect } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  Tooltip,
  alpha,
  useTheme,
  Card,
  InputAdornment,
  Container,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import { DataGrid, GridToolbar, GridActionsCellItem } from "@mui/x-data-grid"
import {
  Edit,
  Delete,
  Search,
  CalendarToday, // More specific calendar icon
  AccessTime,    // More specific clock icon
  Flag,
  RadioButtonUnchecked, // Icon for pending
  HelpOutline, // Icon for other statuses
  InfoOutlined,
  CheckCircleOutlineOutlined, // For overdue badge
} from "@mui/icons-material" // Using MUI icons for consistency
import dayjs from "dayjs"
import { useNavigate } from "react-router-dom"
import DeleteConfirmationModal from "./ConfirmModal" // Assuming this can take title and message
import { useStore } from "../context/useTasks"
import Printer from '@mui/icons-material/PrintRounded';
import { Plus } from "lucide-react"
// Helper function to get status properties
const getStatusProps = (status, theme) => {
  const s = status?.toLowerCase() || "pending"
  switch (s) {
    case "completed":
      return {
        label: "Completed",
        icon: <CheckCircleOutlineOutlined sx={{ fontSize: 16, mr: 0.5 }} />,
        color: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
      }
    case "inprogress": // Example, add more as needed
      return {
        label: "In Progress",
        icon: <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />,
        color: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, 0.1),
      }
    case "pending":
    default:
      return {
        label: "Pending",
        icon: <RadioButtonUnchecked sx={{ fontSize: 16, mr: 0.5 }} />,
        color: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.1),
      }
  }
}


export default function TaskTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const theme = useTheme()
  const {
    tasks,
    loading,
    selectedTaskIds,
    setSelectedTaskIds,
    handleClickOpen: openSingleDeleteModal, // Renamed for clarity
    setSelectedItem: setSelectedItemForSingleDelete, // Renamed
    // --- For useStore snackbar ---
    snackbarOpen,
    snackbarMessage,
    setSnackbarOpen,
    // Assuming useStore provides these or you implement them:
    // showSnackbar, // This would be ideal if useStore handles severity
    // batchDeleteTasks, // Assumed to be in useStore
  } = useStore()

  // --- State for batch delete confirmation ---
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false)

  // --- Temporary snackbar state until useStore's snackbar is fully configured for severity ---
  const [localSnackbar, setLocalSnackbar] = useState({ open: false, message: "", severity: "info" })

  // Use this if useStore.showSnackbar doesn't handle severity or you want local control
  const showLocalSnackbar = (message, severity = "success") => {
    setLocalSnackbar({ open: true, message, severity })
  }
  const handleCloseLocalSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setLocalSnackbar(prev => ({ ...prev, open: false }));
  };


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase())
  }

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks
    return tasks.filter(
      (task) =>
        task.Title?.toLowerCase().includes(searchQuery) ||
        task.AssignedName?.toLowerCase().includes(searchQuery) ||
        (typeof task.DesignationId === 'string' && task.DesignationId?.toLowerCase().includes(searchQuery))
      //  ||
      // (typeof task.DesignationId === 'number' && task.DesignationId?.toString().includes(searchQuery))
    )
  }, [tasks, searchQuery])

  const handleSelectionModelChange = (newSelectionModel) => {
    setSelectedTaskIds(newSelectionModel)
  }

  const handleDeleteSelected = () => {
    if (selectedTaskIds.length > 0) {
      setIsBatchDeleteModalOpen(true)
    } else {
      showLocalSnackbar("No tasks selected for deletion.", "warning");
    }
  }

  const handleConfirmBatchDelete = async () => {
    console.log("Attempting to batch delete:", selectedTaskIds)
    alert(`Implement batchDeleteTasks in useStore to delete: ${selectedTaskIds.join(', ')}`);
    setIsBatchDeleteModalOpen(false)
  }


  const printTask = (task) => {
    const printContent = `
      Task ID: ${task.TaskId}
      Title: ${task.Title}
      Assigned To: ${task.AssignedName || "N/A"}
      Designation: ${task.DesignationId || "N/A"} 
      Due Date: ${task.DueDate ? dayjs(task.DueDate).format("MMM D, YYYY") : "N/A"}
      Last Updated: ${dayjs(task.LastUpdateDate || task.EntryDate).format("MMM D, YYYY, h:mm A")}
      Priority: ${task.Priority || "N/A"}
      Status: ${getStatusProps(task.Status, theme).label}
      Description: ${task.Description || "N/A"}
    `
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Task Details</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1 { color: #1976d2; } .task-details { white-space: pre-line; }
        </style></head><body>
        <h1>Task Details</h1><div class="task-details">${printContent}</div>
        </body></html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleEditTask = (task) => {
    navigate(`/?id=${task?.TaskId}`)
  }

  const getPriorityChipProps = (priority) => {
    const p = priority?.toLowerCase()
    switch (p) {
      case "high":
        return {
          label: "High",
          color: theme.palette.error.main,
          backgroundColor: alpha(theme.palette.error.main, 0.1),
        }
      case "medium":
        return {
          label: "Medium",
          color: theme.palette.warning.main,
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
        }
      case "low":
        return {
          label: "Low",
          color: theme.palette.info.main,
          backgroundColor: alpha(theme.palette.info.main, 0.1),
        }
      default:
        return {
          label: priority || "Normal",
          color: theme.palette.text.secondary,
          backgroundColor: alpha(theme.palette.grey[500], 0.1),
        }
    }
  }

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status?.toLowerCase() === "completed") return false
    return dayjs(dueDate).isBefore(dayjs(), "day")
  }

  const columns = useMemo(
    () => [
      {
        field: "TaskId",
        headerName: "ID",
        width: 80,
        renderHeader: () => <Typography variant="subtitle2" fontWeight="600">ID</Typography>,
      },
      {
        field: "Title",
        headerName: "Task",
        flex: 1,
        minWidth: 250,
        renderHeader: () => <Typography variant="subtitle2" fontWeight="600">Task</Typography>,
        renderCell: (params) => (
          <Tooltip title={params.row.Title || "Untitled Task"} placement="bottom-start">
            <Typography variant="body2" fontWeight={500} noWrap>
              {params.row.Title || "Untitled Task"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "AssignedName",
        headerName: "Assigned To",
        width: 150,
        renderHeader: () => <Typography variant="subtitle2" fontWeight="600">Assigned To</Typography>,
        renderCell: (params) => (
          <Typography variant="body2" noWrap>{params.row.AssignedName || "—"}</Typography>
        ),
      },
      {
        field: "DesignationId", // Or DesignationName if API provides it
        headerName: "Designation",
        width: 150,
        renderHeader: () => <Typography variant="subtitle2" fontWeight="600">Designation</Typography>,
        renderCell: (params) => (
          <Typography variant="body2" noWrap>{params.row.DesignationId || "—"}</Typography>
        ),
      },
      {
        field: "DueDate",
        headerName: "Due Date",
        width: 150,
        renderHeader: () => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="subtitle2" fontWeight="600">Due Date</Typography>
          </Box>
        ),
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color={isOverdue(params.row.DueDate, params.row.Status) ? theme.palette.error.main : "text.primary"}>
              {params.row.DueDate ? dayjs(params.row.DueDate).format("MMM D, YYYY") : "—"}
            </Typography>
            {isOverdue(params.row.DueDate, params.row.Status) && (
              <Tooltip title="Overdue">
                <InfoOutlined sx={{ fontSize: 16, ml: 0.5, color: theme.palette.error.main }} />
              </Tooltip>
            )}
          </Box>
        ),
      },
      {
        field: "LastUpdateDate",
        headerName: "Last Updated",
        width: 180,
        renderHeader: () => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="subtitle2" fontWeight="600">Last Updated</Typography>
          </Box>
        ),
        renderCell: (params) => {
          const lastUpdate = params.row.LastUpdateDate || params.row.EntryDate
          return (
            <Typography variant="body2" color="text.secondary">
              {lastUpdate ? dayjs(lastUpdate).format("MMM D, YYYY, h:mm A") : "—"}
            </Typography>
          )
        },
      },
      {
        field: "Priority",
        headerName: "Priority",
        width: 120,
        renderHeader: () => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Flag sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="subtitle2" fontWeight="600">Priority</Typography>
          </Box>
        ),
        renderCell: (params) => {
          const priorityProps = getPriorityChipProps(params.row.Priority)
          return (
            <Chip
              label={priorityProps.label}
              size="small"
              sx={{
                backgroundColor: priorityProps.backgroundColor,
                color: priorityProps.color,
                fontWeight: 500,
                borderRadius: '6px',
              }}
            />
          )
        },
      },
      {
        field: "Status",
        headerName: "Status",
        width: 150, // Increased width for icon and text
        renderHeader: () => <Typography variant="subtitle2" fontWeight="600">Status</Typography>,
        renderCell: (params) => {
          const statusProps = getStatusProps(params.row.Status, theme)
          return (
            <Chip
              icon={statusProps.icon}
              label={statusProps.label}
              size="small"
              sx={{
                backgroundColor: statusProps.backgroundColor,
                color: statusProps.color,
                fontWeight: 500,
                borderRadius: '6px',
                '& .MuiChip-icon': { color: statusProps.color, marginLeft: '6px' },
                '& .MuiChip-label': { paddingLeft: statusProps.icon ? '4px' : '10px', paddingRight: '10px' },
              }}
            />
          )
        },
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 120,
        cellClassName: "actions",
        getActions: (params) => [
          <GridActionsCellItem
            icon={<Tooltip title="Edit Task"><Edit sx={{ fontSize: 20 }} /></Tooltip>}
            label="Edit"
            onClick={() => handleEditTask(params.row)}
            color="primary"
          />,
          <GridActionsCellItem
            icon={<Tooltip title="Print Task"><Printer sx={{ fontSize: 20 }} /></Tooltip>}
            label="Print"
            onClick={() => printTask(params.row)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<Tooltip title="Delete Task"><Delete sx={{ fontSize: 20 }} /></Tooltip>}
            label="Delete"
            onClick={() => {
              setSelectedItemForSingleDelete(params.row.TaskId) // Set item for store's modal
              openSingleDeleteModal(params.row.TaskId) // Open store's modal
            }}
            color="error"
          />,
        ],
      },
    ],
    [theme, openSingleDeleteModal, setSelectedItemForSingleDelete]
  )

  const dataGridStyles = {
    border: "none",
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: alpha(theme.palette.background.paper, 0.8), // Lighter header
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    },
    "& .MuiDataGrid-cell": {
      borderBottom: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      alignItems: 'center',
      // Forcing noWrap and ellipsis, ensure Tooltip is used for full content
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    "& .MuiDataGrid-cell[data-field='Title'] .MuiTypography-root": { // Target Title cell specifically for overflow
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    "& .MuiDataGrid-row": {
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.04),
      },
      '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
        },
      },
    },
    "& .MuiDataGrid-row--completed": { // Custom class name
      backgroundColor: alpha(theme.palette.success.light, 0.1), // Light green for completed
      "&:hover": {
        backgroundColor: alpha(theme.palette.success.light, 0.15),
      },
    },
    "& .MuiDataGrid-row--overdue": { // Custom class name
      backgroundColor: alpha(theme.palette.error.light, 0.1), // Light red for overdue
      "&:hover": {
        backgroundColor: alpha(theme.palette.error.light, 0.15),
      },
    },
    "& .MuiDataGrid-footerContainer": {
      borderTop: `1px solid ${theme.palette.divider}`,
    },
    "& .MuiCheckbox-root": {
      color: theme.palette.primary.main,
    },
    "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
      color: theme.palette.primary.main, // Make toolbar buttons match theme
      fontSize: '0.875rem',
    },
    height: "calc(100vh - 280px)", // Adjust based on your header/footer height
    minHeight: 805, // Minimum height
    width: "100%",
  }

  return (
    <>
      <DeleteConfirmationModal
        open={isBatchDeleteModalOpen}
        handleClose={() => setIsBatchDeleteModalOpen(false)}
        handleConfirm={handleConfirmBatchDelete}
        title="Confirm Batch Deletion"
        message={`Are you sure you want to delete ${selectedTaskIds.length} selected task(s)?`}
      />
      <Snackbar open={localSnackbar.open} autoHideDuration={6000} onClose={handleCloseLocalSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseLocalSnackbar} severity={localSnackbar.severity} sx={{ width: '100%' }} variant="filled">
          {localSnackbar.message}
        </Alert>
      </Snackbar>


      <Container maxWidth="" sx={{ py: { xs: 2, md: 3 } }}>
        <Card
          elevation={2} // Subtle elevation
          sx={{
            borderRadius: 3, // Smoother radius
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                <Typography onClick={() => navigate('/')} variant="h5" fontWeight="600" sx={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                  Quick Task
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    placeholder="Search tasks..."
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2 },
                      },
                    }}
                  />
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1.5 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Plus />}
                  onClick={() => navigate("/")} // To add task page
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 500 }}
                >
                  Add Task
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteSelected}
                  disabled={selectedTaskIds.length === 0 || loading}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 500 }}
                >
                  Delete ({selectedTaskIds.length})
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: dataGridStyles.height }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading tasks...</Typography>
              </Box>
            ) : tasks?.length === 0 && !searchQuery ? (
              <Box
                sx={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: dataGridStyles.minHeight, p: 3, textAlign: "center",
                }}
              >
                <img src="/placeholder-no-tasks.svg" alt="No tasks" style={{ width: 150, marginBottom: theme.spacing(2) }} /> {/* Add a relevant SVG */}
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Tasks Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Get started by adding your first task.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => navigate("/")}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Add Your First Task
                </Button>
              </Box>
            ) : (
              <DataGrid
                rows={filteredTasks}
                columns={columns}
                getRowId={(row) => row.TaskId}
                sx={dataGridStyles}
                checkboxSelection
                onRowSelectionModelChange={handleSelectionModelChange}
                rowSelectionModel={selectedTaskIds}
                disableRowSelectionOnClick
                pagination
                initialState={{
                  pagination: { paginationModel: { pageSize: 20 } },
                }}
                pageSizeOptions={[20, 20, 50, 100]}
                getRowClassName={(params) => {
                  let classNames = [];
                  if (params.row.Status?.toLowerCase() === "completed") {
                    classNames.push("MuiDataGrid-row--completed");
                  } else if (isOverdue(params.row.DueDate, params.row.Status)) {
                    classNames.push("MuiDataGrid-row--overdue");
                  }
                  return classNames.join(' ');
                }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: false,
                    sx: {
                      padding: theme.spacing(1, 1, 0, 1),
                      justifyContent: 'space-between',
                      '& .MuiDataGrid-toolbarExport': {
                        marginLeft: 'auto',
                      },
                    },
                  },
                }}
                autoHeight={filteredTasks.length <= 10}
              />
            )}
          </Box>
        </Card>
      </Container>
    </>
  )
}