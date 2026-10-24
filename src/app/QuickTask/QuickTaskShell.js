import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StoreProvider } from './context/useTasks';
import { AuthProvider } from './context/UseAuth';
import Entry from './Entry';

const theme = createTheme({ /* same as before */ });

const Main = () => (
  <Suspense fallback={<div />}>
    <AuthProvider>
      <BrowserRouter basename="/V1/QuickTask">
        <StoreProvider>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <CssBaseline />
              <Entry />
            </LocalizationProvider>
          </ThemeProvider>
        </StoreProvider>
      </BrowserRouter>
    </AuthProvider>
  </Suspense>
);

export default function QuickTaskShell() {
  return <Main />;
}