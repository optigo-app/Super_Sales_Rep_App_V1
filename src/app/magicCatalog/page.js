'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, GlobalStyles } from '@mui/material';
import Home from '@mc/components/Home/Home';
import { bridgeSession } from '@mc/utils/sessionBridge';

export default function MagicCatalogPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Bridge the main app's session variables to the magicCatalog format
    bridgeSession();
    setReady(true);
  }, []);



  if (!ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', position: 'relative' }}>
      {/* Hide the page scrollbar so the home screen looks like a fixed app view */}
      <GlobalStyles
        styles={{
          'html, body': {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
          },
        }}
      />
      <Home />
    </Box>
  );
}
