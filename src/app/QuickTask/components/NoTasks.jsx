import { memo } from "react";
import { Box, Typography } from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

const NoTasks = memo(() => {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 5, color: "text.secondary" }}>
        <AssignmentTurnedInIcon sx={{ fontSize: 60, mb: 2, color: "grey.400" }} />
        <Typography variant="h6">No tasks found</Typography>
        <Typography variant="body2">You're all caught up. Enjoy your day!</Typography>
      </Box>
    );
  });
  
  export default NoTasks;