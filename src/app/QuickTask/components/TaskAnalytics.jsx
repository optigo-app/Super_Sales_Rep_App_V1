import { Box, Typography, Paper, Divider, Chip, Stack, CircularProgress, Skeleton, Tooltip } from "@mui/material";
import { AccessTime } from "@mui/icons-material";
import { calculatePercentage } from "../lib/functions";
import { useStore } from "../context/useTasks";
import { grey } from "@mui/material/colors";

const gridSx = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 };

const tileSx = {
  p: 1.5,
  borderRadius: 2,
  bgcolor: "#F5F3FF",
  border: "1px solid #EDE9FE",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const Ring = ({ value, color }) => (
  <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
    <CircularProgress variant="determinate" value={value} size={56} thickness={5} sx={{ color }} />
    <Box sx={{ position: "absolute" }}>
      <Typography variant="caption" fontWeight="bold">
        {Math.round(value)}%
      </Typography>
    </Box>
  </Box>
);

const TaskAnalytics = ({ OpenOverdueTab }) => {
  const { selectedTask, taskAnalytics, loading } = useStore();
  const { totalTasks, activeTasks, completedTasks, overdueTasksCount, todaysTasks } = taskAnalytics;

  if (selectedTask) return null;
  if (loading) return <SkeletonTask />;

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "white" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Task Analytics</Typography>
        <Chip label={`Total: ${totalTasks}`} size="small" sx={{ fontWeight: 600 }} />
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <AccessTime fontSize="small" sx={{ color: "#7C3AED" }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>Task Status</Typography>
      </Stack>

      <Box sx={{ ...gridSx, mb: 1.5 }}>
        <Box sx={tileSx}>
          <Ring value={calculatePercentage(activeTasks, totalTasks)} color="#7C3AED" />
          <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Active</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>{activeTasks}</Typography>
        </Box>

        <Box sx={tileSx}>
          <Ring value={calculatePercentage(completedTasks, totalTasks)} color="#10B981" />
          <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Completed</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#10B981" }}>{completedTasks}</Typography>
        </Box>
      </Box>

      <Box sx={gridSx}>
        <Box sx={tileSx}>
          <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Today</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>{todaysTasks}</Typography>
        </Box>

        <Tooltip title="Open Overdue Tasks">
          <Box
            onClick={OpenOverdueTab}
            sx={{
              ...tileSx,
              cursor: "pointer",
              "&:active": { transform: "scale(0.98)" },
              transition: "transform 0.15s",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Overdue</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#E24B4A" }}>{overdueTasksCount}</Typography>
          </Box>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default TaskAnalytics;

const SkeletonTask = () => (
  <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "white" }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Skeleton sx={{ backgroundColor: grey[200] }} variant="text" width={100} height={30} />
      <Skeleton sx={{ backgroundColor: grey[200] }} variant="rounded" width={60} height={24} />
    </Box>
    <Divider sx={{ mb: 2 }} />
    <Skeleton sx={{ backgroundColor: grey[200], mb: 2 }} variant="text" width={100} height={30} />
    <Box sx={gridSx}>
      {[...Array(4)].map((_, index) => (
        <Box key={index} sx={tileSx}>
          {[0, 1].includes(index) && <Skeleton variant="circular" width={56} height={56} sx={{ mb: 1 }} />}
          <Skeleton variant="text" width={50} height={20} />
          <Skeleton variant="text" width={40} height={30} />
        </Box>
      ))}
    </Box>
  </Paper>
);
