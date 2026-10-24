import React, { useMemo, useCallback, memo } from "react";
import { Tabs, Tab, Box, Button } from "@mui/material";
import { useStore } from "../context/useTasks";

const TabMenuBar = memo(({ tabValue, setTabValue, setExpandedId, handleClearSorting, setPage, setRowsPerPage }) => {
  const { tasks, setSelectedTask } = useStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeCount = useMemo(() => tasks?.filter((t) => t?.Status !== "Closed" && t?.DesignationId).length, [tasks]);
  const unassignedCount = useMemo(() => tasks.filter((t) => !t.DesignationId && t?.Status !== "Closed").length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t?.Status === "Closed").length, [tasks]);
  const overdueCount = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task?.DueDate) return false;
        const taskDate = new Date(task?.DueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate < today && !task.completed;
      }).length,
    [tasks]
  );

  const handleTabsChange = useCallback(
    (event, newValue) => {
      setTabValue(newValue);
      setSelectedTask(null);
      setExpandedId(null);
      // handleClearSorting();
      setPage(0);
      setRowsPerPage(25);
    },
    [setTabValue, setSelectedTask, setExpandedId, handleClearSorting, setPage, setRowsPerPage]
  );

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, display: "flex", alignItems: "center" }}>
      <Tabs value={tabValue} onChange={handleTabsChange}>
        <Tab label={`All (${tasks?.length})`} />
        <Tab label={`Active (${activeCount})`} />
        <Tab label={`Unassigned (${unassignedCount})`} />
        <Tab label={`Completed (${completedCount})`} />
        <Tab label={`Overdue (${overdueCount})`} />
      </Tabs>
    </Box>
  );
});

export default TabMenuBar;
