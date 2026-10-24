import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const indianEmployees = [
    { id: 1, name: "Aarav Sharma", designation: "Sales" },
    { id: 2, name: "Aditi Patel", designation: "Sales" },
    { id: 3, name: "Arjun Singh", designation: "Developer" },
    { id: 4, name: "Ananya Gupta", designation: "Developer" },
    { id: 5, name: "Vikram Malhotra", designation: "Manager" },
    { id: 6, name: "Neha Reddy", designation: "Developer" },
    { id: 7, name: "Rajesh Kumar", designation: "Developer" },
    { id: 8, name: "Priya Verma", designation: "QA Engineer" },
    { id: 9, name: "Sanjay Mehta", designation: "Sales" },
    { id: 10, name: "Divya Joshi", designation: "HR Manager" },
    { id: 11, name: "Rahul Kapoor", designation: "Marketing" },
    { id: 12, name: "Meera Iyer", designation: "Content Writer" },
    { id: 13, name: "Karan Agarwal", designation: "System Admin" },
    { id: 14, name: "Pooja Nair", designation: "Designer" },
    { id: 15, name: "Amit Choudhary", designation: "Project Manager" },
    { id: 16, name: "Kavita Rao", designation: "Business Analyst" },
    { id: 17, name: "Deepak Sharma", designation: "Developer" },
    { id: 18, name: "Sunita Patel", designation: "Sales" },
    { id: 19, name: "Vivek Singh", designation: "Designer" },
    { id: 20, name: "Anjali Gupta", designation: "Data Scientist" },
    { id: 21, name: "Prakash Malhotra", designation: "DevOps" },
    { id: 22, name: "Shikha Reddy", designation: "Frontend Developer" },
    { id: 23, name: "Mohan Kumar", designation: "Backend Developer" },
    { id: 24, name: "Lakshmi Verma", designation: "QA Engineer" },
    { id: 25, name: "Suresh Mehta", designation: "Sales" },
    { id: 26, name: "Ritu Joshi", designation: "HR Manager" },
    { id: 27, name: "Vijay Kapoor", designation: "Marketing" },
    { id: 28, name: "Nisha Iyer", designation: "Content Writer" },
    { id: 29, name: "Anil Agarwal", designation: "System Admin" },
    { id: 30, name: "Geeta Nair", designation: "Designer" },
    { id: 31, name: "Rajan", designation: "React Developer" },
    { id: 32, name: "Shivam", designation: "React Developer" },
    { id: 33, name: "Abhisek", designation: "React Developer" },
    { id: 34, name: "Jenish", designation: "React Developer" },
    { id: 35, name: "Subrata", designation: "React Developer" },
]

const uniqueDesignations = Array.from(new Set(indianEmployees.map((emp) => emp.designation))).sort((a, b) => a.localeCompare(b))


const users = [
    { id: 1, name: "John Doe", designation: "Sales" },
    { id: 2, name: "Jane Smith", designation: "Sales" },
    { id: 3, name: "Mike Johnson", designation: "Developer" },
    { id: 4, name: "Sarah Brown", designation: "Developer" },
    { id: 5, name: "Emma White", designation: "Manager" },
    { id: 6, name: "James Black", designation: "Developer" },
    ...indianEmployees,
]

const priorityOrder = ["none", "low", "medium", "high", "very-high", "critical"];
const statusOptions = ["Assigned", "In Progress", "Under Review", "Closed"];


const sortingOptions = [
    {
      header: "Sort By Date",
      options: [
        { label: "Due Date (Ascending)", value: "DueDate-ASC", icon: <ArrowUpwardIcon sx={{ fontSize: 18 }} /> },
        { label: "Due Date (Descending)", value: "DueDate-DESC", icon: <ArrowDownwardIcon sx={{ fontSize: 18 }} /> },
      ],
    },
    {
      header: "Sort By Priority",
      options: [
        { label: "Priority (Low to High)", value: "PrioritySort-ASC", icon: <ArrowUpwardIcon sx={{ fontSize: 18 }} /> },
        { label: "Priority (High to Low)", value: "PrioritySort-DESC", icon: <ArrowDownwardIcon sx={{ fontSize: 18 }} /> },
      ],
    },
    {
      header: "Sort By Status",
      options: [
        { label: "Status (Low to High)", value: "StatusSort-ASC", icon: <ArrowUpwardIcon sx={{ fontSize: 18 }} /> },
        { label: "Status (High to Low)", value: "StatusSort-DESC", icon: <ArrowDownwardIcon sx={{ fontSize: 18 }} /> },
      ],
    },
  ];

export {
    users,
    uniqueDesignations,
    priorityOrder,
    statusOptions,
    sortingOptions
}

