import { useState, useContext, useEffect, createContext, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { calculateTaskAnalytics } from "../utils/taskAnalytics";
import QuickTaskApi from "../apis/ApiController";
import { useAuth } from "./UseAuth";

const StoreContext = createContext({});

export function StoreProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.UserID;

  const [tasks,               setTasks]               = useState([]);
  const [selectedTask,        setSelectedTask]        = useState(null);
  const [snackbarOpen,        setSnackbarOpen]        = useState(false);
  const [snackbarMessage,     setSnackbarMessage]     = useState("");
  const [selectedTaskIds,     setSelectedTaskIds]     = useState([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [open,                setOpen]                = useState(false);
  const [SelectedItem,        setSelectedItem]        = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [refreshList,         setRefreshList]         = useState(false);
  const [employeeList,        setEmployeeList]        = useState([]);

  const showSnackbar = (message) => { setSnackbarMessage(message); setSnackbarOpen(true); };

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await QuickTaskApi.listQuickTask({ userId, sortField: "EntryDate", sortType: "DESC" });
        setTasks(res?.Data?.rd || []);
      } catch (error) {
        console.error("Failed to fetch task list:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchTasks();
  }, [refreshList, userId]);

  // ── Employee list (cached) ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const cached = localStorage.getItem("employeeList");
        if (cached) { setEmployeeList(JSON.parse(cached)); return; }
        const res = await QuickTaskApi.getEmployeeList({ userId });
        if (res?.Data?.rd) {
          localStorage.setItem("employeeList", JSON.stringify(res.Data.rd));
          setEmployeeList(res.Data.rd);
        }
      } catch (error) { console.error(error); }
    };
    if (userId) fetchEmployees();
  }, [userId]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addTask = async (isModal, payload) => {
    try {
      if (isModal !== "1") {
        if (!payload?.trim()) return;
        await QuickTaskApi.createQuickTask({ title: payload, userId });
      } else {
        await QuickTaskApi.createQuickTask({ ...payload, userId });
      }
      showSnackbar("Task added successfully");
      setRefreshList(p => !p);
    } catch (error) { console.error(error); }
  };

  const saveEditedTask = async (editTask) => {
    try {
      if (!editTask || selectedTask?.TaskId !== editTask.TaskId) return;
      await QuickTaskApi.updateQuickTask({
        taskId:        editTask.TaskId,
        title:         editTask.Title,
        description:   editTask.Description,
        dueDate:       editTask.DueDate,
        status:        editTask.Status,
        priority:      editTask.Priority,
        assignedTo:    editTask?.AssignedId || Number(editTask?.AssignedTo),
        designationId: editTask?.DesignationId ? editTask.DesignationParentId : "",
      });
      setSelectedTask(null);
      showSnackbar("Task updated successfully");
      setRefreshList(p => !p);
    } catch (error) { console.error(error); }
  };

  const deleteTask = async (id) => {
    try {
      if (SelectedItem === null) { alert("Please select a task to delete"); return; }
      await QuickTaskApi.deleteQuickTask({ taskId: id });
      setSelectedTask(null);
      setOpen(false);
      setSelectedItem(null);
      showSnackbar("Task deleted successfully");
      setRefreshList(p => !p);
    } catch (error) { console.error(error); }
  };

  // ✅ deleteSelectedTasks — API calls for each selected task
  const deleteSelectedTasks = async () => {
    try {
      await Promise.all(selectedTaskIds.map(id => QuickTaskApi.deleteQuickTask({ taskId: id })));
      setSelectedTaskIds([]);
      showSnackbar("Selected tasks deleted successfully");
      setRefreshList(p => !p);
    } catch (error) { console.error(error); }
  };

  const toggleTaskSelection    = (id) => setSelectedTaskIds(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]);
  const toggleSelectionMode    = () => { setIsSelectionModeActive(p => !p); setSelectedTaskIds([]); };
  const toggleTaskCompletion   = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const updateTaskPriority     = (id, priority) => setTasks(p => p.map(t => t.id === id ? { ...t, priority } : t));
  const clearCompletedTasks    = () => { setTasks(p => p.filter(t => !t.completed)); showSnackbar("Completed tasks cleared"); };

  const handleClickOpen = (id) => { setOpen(true); setSelectedItem(id); };
  const handleClose     = ()   => { setOpen(false); setSelectedItem(null); };
  const handleConfirm   = ()   => { setOpen(false); deleteTask(SelectedItem); };

  const taskAnalytics      = useMemo(() => calculateTaskAnalytics(tasks), [tasks]);
  const uniqueDesignations = useMemo(() =>
    Array.from(new Set(employeeList.map(e => e?.designation).filter(d => d?.trim())))
      .sort((a, b) => a.localeCompare(b)),
    [employeeList]
  );

  return (
    <StoreContext.Provider value={{
      tasks, setTasks, selectedTask, setSelectedTask,
      snackbarOpen, setSnackbarOpen, snackbarMessage, setSnackbarMessage,
      selectedTaskIds, setSelectedTaskIds, isSelectionModeActive,
      open, loading, setLoading, employeeList, taskAnalytics, uniqueDesignations,
      addTask, saveEditedTask, deleteTask, deleteSelectedTasks,
      toggleTaskSelection, toggleSelectionMode, toggleTaskCompletion,
      updateTaskPriority, clearCompletedTasks, showSnackbar,
      handleClickOpen, handleClose, handleConfirm,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useStore must be used within a StoreProvider");
  return context;
}