'use client';  // ← add this

import { useCallback, useMemo, memo, useEffect, useState, useRef } from "react";
import { Box, Button, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationBar from "./NotificationBar";
import TaskAnalytics from "./TaskAnalytics";
import TaskDetail from "./TaskDetail";
import ConfirmationModal from "./ConfirmModal";
import TabMenuBar from "./TabMenuBar";
import TaskList from "./TaskList";
import { getFilteredAndSortedTasks } from "../utils/FilterData";
import QuickTaskApi from "../apis/ApiController";
import { useAuth } from "../context/UseAuth";
import { Tooltip, IconButton, Menu, useTheme, ListSubheader, MenuItem, Skeleton } from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import ClearIcon from "@mui/icons-material/Clear";
import { sortingOptions } from "../lib/constants";
import SearchBar from "./SearchBar";
import AddIcon from "@mui/icons-material/Add";
import { useStore } from "../context/useTasks";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

function QuickTaskApp() {
  const Router = useNavigate();
  const [expandedId, setExpandedId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editTask, setEditTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [SelectedSorting, setSelectedSorting] = useState(null);
  const { saveEditedTask, setSelectedTask, tasks, setTasks, setLoading } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRun = useRef(true);
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const theme = useTheme();
  const greeting = useMemo(() => getGreeting(), []);
  const username = user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : "Guest";

  const [title, setTitle] = useState("");
  const { addTask } = useStore();

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    if (SelectedSorting) {
      params.set("sort", SelectedSorting);
    }
    setSearchParams(params);
  }, [searchQuery, SelectedSorting, setSearchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlSort = searchParams.get("sort") || "";

    setSearchQuery(urlSearch);
    setSelectedSorting(urlSort);
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const handler = setTimeout(() => {
      const fetchTasks = async () => {
        setTabValue(0);
        setPage(0);
        try {
          const res = await QuickTaskApi.listQuickTask({
            userId: user?.UserID,   // ✅
            ...(searchQuery && { searchTerm: searchQuery }),
            sortField: SelectedSorting ? SelectedSorting.split("-")[0] : "EntryDate",
            sortType: SelectedSorting ? SelectedSorting.split("-")[1] : "DESC",
          });
          setTasks([...(res?.Data?.rd || [])]);
        } catch (error) {
          console.error("Failed to fetch task list:", error);
        } finally {
          setLoading(false);   // ✅
        }
      };

      fetchTasks();
    }, 0);

    return () => clearTimeout(handler);
  }, [searchQuery, SelectedSorting]);

  const filteredAndSorted = useMemo(() => getFilteredAndSortedTasks(tasks, tabValue), [tasks, tabValue]);

  const paginatedTasks = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSorted.slice(start, start + rowsPerPage);
  }, [filteredAndSorted, page, rowsPerPage]);

  useEffect(() => {
    if (!editTask) {
      setEditTask(null);
    }
  }, [editTask]);

  const handleDateChange = (newDate) => {
    const dateToSave = newDate ? newDate?.toDate() : null;
    setEditTask((prev) => ({
      ...prev,
      DueDate: dateToSave,
    }));
  };

  const handleStatusChange = (value) => {
    setEditTask((prev) => ({
      ...prev,
      Status: value,
    }));
  };

  const HandleEditTodo = () => {
    saveEditedTask(editTask);
    Router("/");
    setExpandedId(null);
    setSelectedTask(null);
    setEditTask(null);
  };

  const handleAccordionChange = (taskId, data) => {
    return (event, isExpanded) => {
      setExpandedId(isExpanded ? taskId : null);
      if (isExpanded) {
        const assignedUserData = {
          userId: data?.AssignedTo || data?.AssignedId || "",
          user: data?.AssignedName || "",
          designation: data?.DesignationId || "",
          designationId: data?.DesignationParentId || data?.DesignaitonId || "",
          AssignedId: data?.AssignedTo || data?.AssignedId || "",
          id: data?.AssignedTo || data?.AssignedId || "",
        };

        const editTaskData = {
          ...data,
          selectedUserData: assignedUserData,
        };

        setEditTask(editTaskData);
        setSelectedTask(editTaskData);
      } else {
        setEditTask(null);
        setSelectedTask(null);
      }
    };
  };

  const handleAssigned = (value) => {
    setEditTask((prev) => ({
      ...prev,
      AssignedId: value?.AssignedId || value?.id,
      AssignedName: value?.user || "",
      AssignedTo: value?.user || "",
      DesignationParentId: value?.DesignaitonId || "",
      DesignationId: value?.DesignaitonId || "",
    }));
  };
  const handleAccordionCancel = () => {
    setExpandedId(null);
  };

  const handleSortingChange = (value) => {
    setSelectedSorting(value);
    handleMenuClose();
  };

  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleClearSorting = () => {
    setSelectedSorting("");
    handleMenuClose();
    setSearchQuery("");
    setSearchParams("");
  };

  const OpenOverdueTab = () => {
    setTabValue(4);
  };



  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask("0", title);
    handleClearSorting();
    setTitle("");
  };


  return (
    <>
      <ConfirmationModal />
      <Box
        sx={{
          bgcolor: "background.default",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          px: { xs: 1.5, sm: 2 },
          py: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              onClick={() => { window.location.href = '/V1/'; }}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 6px rgba(124,58,237,0.1)',
                cursor: 'pointer',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
                '&:active': { transform: 'scale(0.9)' },
                transition: 'transform 0.15s',
              }}
            >
              <ArrowLeft size={18} color="#1F2937" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                Quick Task
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                {filteredAndSorted?.length} task{filteredAndSorted?.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 0 }}>
              {/* here header section */}
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 1.5, sm: 0 }, mb: 3 }}>
                {user ? (
                  <Box>
                    <Typography variant="body1" color="textSecondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.75rem" }}>
                      {greeting} ,
                    </Typography>
                    <Typography
                      variant="h3"
                      component="h2"
                      fontWeight={600}
                      sx={{
                        fontSize: "1.2rem",
                        [theme.breakpoints.down("sm")]: {
                          fontSize: "1.1rem",
                        },
                        textTransform: "capitalize",
                      }}
                    >
                      {username}
                    </Typography>
                  </Box>
                ) : (
                  <Skeleton variant="text" width={120} height={20} />
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                  <SearchBar filters={searchQuery} handleSearchChange={setSearchQuery} />

                  <Tooltip title="Sort By">
                    <IconButton
                      onClick={handleMenuOpen}
                      color="default"
                      sx={{
                        position: "relative",
                        borderRadius: "50%",
                        background: "rgba(90, 90, 90, 0.055)",
                      }}
                    >
                      {SelectedSorting && (
                        <Box
                          sx={{
                            width: 13,
                            height: 13,
                            borderRadius: "50%",
                            backgroundColor: "yellow",
                            position: "absolute",
                            top: 4,
                            right: 4,
                          }}
                        />
                      )}
                      <SortIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Clear Sorting">
                    <IconButton
                      onClick={handleClearSorting}
                      sx={{
                        background: "rgba(90, 90, 90, 0.055)",
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "left",
                    }}
                  >
                    {sortingOptions.map((group) => (
                      <Box key={group.header}>
                        <ListSubheader sx={{ lineHeight: "29px" }}>{group.header}</ListSubheader>
                        {group.options.map((opt) => (
                          <MenuItem
                            key={opt.value}
                            onClick={() => handleSortingChange(opt.value)}
                            sx={{
                              fontSize: "14px",
                              backgroundColor: SelectedSorting === opt.value ? "rgba(238, 234, 29, 0.1)" : "transparent",
                            }}
                          >
                            {opt.icon}
                            <Box component="span" sx={{ ml: 1 }}>
                              {opt.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Box>
                    ))}
                  </Menu>
                </Box>
              </Box>
              {/* adding quick add task */}

              <Box sx={{ display: "flex", mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Add a new task..."
                  value={title}
                  autoFocus
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AddIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                  size="small"
                  sx={{ mr: 2, flex: "1", width: "100%" }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button variant="contained" onClick={handleSubmit} sx={{ flex: "1" }}>
                    Add Task
                  </Button>
                </Box>
              </Box>
              {/* here tabs section */}
              <TabMenuBar setPage={setPage} setRowsPerPage={setRowsPerPage} setTabValue={setTabValue} tabValue={tabValue} handleClearSorting={handleClearSorting} setExpandedId={setExpandedId} />
              {/* tasklist mapping */}
              <TaskList handleAssigned={handleAssigned} setPage={setPage} setRowsPerPage={setRowsPerPage} page={page} rowsPerPage={rowsPerPage} searchQuery={searchQuery} filteredTasks={paginatedTasks} count={filteredAndSorted?.length} expandedId={expandedId} handleAccordionChange={handleAccordionChange} handleStatusChange={handleStatusChange} handleDateChange={handleDateChange} handleAccordionCancel={handleAccordionCancel} HandleEditTodo={HandleEditTodo} editTask={editTask} setEditTask={setEditTask} />
            </Paper>
            {/* here detail section */}
            <TaskDetail />
            {/* here analytics section */}
            <TaskAnalytics OpenOverdueTab={OpenOverdueTab} />
          </Box>
        </Box>
      </Box>
      {/* here notification bar section */}
      <NotificationBar />
    </>
  );
}

export default memo(QuickTaskApp);