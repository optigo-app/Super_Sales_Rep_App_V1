export const getFilteredAndSortedTasks = (tasks, tabValue) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);


  let filtered = [...tasks];

  if (tabValue === 1) filtered = filtered?.filter((task) => task?.Status !== 'Closed' && task?.DesignationId);
  else if (tabValue === 3) filtered = filtered?.filter((task) => task?.Status === 'Closed');
  else if (tabValue === 2) filtered = filtered?.filter((task) => !task.DesignationId && task?.Status !== "Closed");
  else if (tabValue === 4) filtered = filtered.filter((task) => {
    if (!task?.DueDate) return false;
    const taskDate = new Date(task?.DueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today && !task.completed;
  })

  return filtered;
};
