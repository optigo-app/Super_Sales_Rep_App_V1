export const FormatDate = (date) => {
    if (!date) return 'N/A';
  
    try {
      const entryDate = new Date(date);
  
      // Handle invalid dates
      if (isNaN(entryDate.getTime())) return 'Invalid Date';
  
      const formatted = entryDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Ensure UTC display
      });
  
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  
const calculatePercentage = (part, total) => (total === 0 ? 0 : (part / total) * 100);

const priorityOptions = [
    { value: "low", label: "Low", color: "#9C27B0" },
    { value: "medium", label: "Medium", color: "#FF9800" },
    { value: "high", label: "High", color: "#F44336" },
    { value: "very-high", label: "Very High", color: "#4CAF50" },
    { value: "critical", label: "Critical", color: "#2196F3" },
];


const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find((option) => option.value === priority?.toLowerCase());
    return priorityOption ? priorityOption.color : "#000000";
};

const formatDate = (date) => {
    const options = { year: "numeric", month: "short", day: "2-digit" };
    return new Intl.DateTimeFormat("en-GB", options).format(new Date(date));
};

export {
    calculatePercentage,
    priorityOptions,
    getPriorityColor,
    formatDate
}