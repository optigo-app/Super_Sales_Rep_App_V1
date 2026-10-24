
import { memo } from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import { grey } from "@mui/material/colors";


const LoadingScreen = memo(() => {
  return (
    <Box sx={{}}>
      <Stack spacing={2}>
        {[...Array(10)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width="100%"
            height={60}
            sx={{
              mb: 1,
              borderRadius: 1,
              backgroundColor: grey[200],
            }}
          />
        ))}
      </Stack>
    </Box>
  );
});

export default LoadingScreen;
