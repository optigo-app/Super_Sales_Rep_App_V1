export function calculateTaskAnalytics(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const analytics = {
    totalTasks: tasks.length,
    activeTasks: tasks.filter((task) => task?.Status !== 'Closed' && task?.DesignationId).length,
    completedTasks: tasks.filter((task) => task?.Status === 'Closed').length,
    highPriorityTasks: tasks.filter((task) => task.priority === "high").length,
    mediumPriorityTasks: tasks.filter((task) => task.priority === "medium").length,
    lowPriorityTasks: tasks.filter((task) => task.priority === "low").length,
    todaysTasks: tasks.filter((task) => {
      if (!task?.DueDate) return false;
      const taskDate = new Date(task?.DueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && !task.completed;
    }).length,
    tomorrowsTasks: tasks.filter((task) => {
      if (!task?.DueDate) return false;
      const taskDate = new Date(task?.DueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === tomorrow.getTime() && !task.completed;
    }).length,
    overdueTasksCount: tasks.filter((task) => {
      if (!task?.DueDate) return false;
      const taskDate = new Date(task?.DueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today && !task.completed;
    }).length,
    overdueTasksList: tasks.filter((task) => {
      if (!task?.DueDate) return false;
      const taskDate = new Date(task?.DueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today && !task.completed;
    }),
    upcomingWeekTasks: tasks.filter((task) => {
      if (!task?.DueDate) return false;
      const taskDate = new Date(task?.DueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= today && taskDate <= nextWeek && !task.completed;
    }).length,
  };

  return analytics;
}
