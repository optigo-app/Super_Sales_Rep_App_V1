// @ts-nocheck
'use client';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7C3AED',
      dark: '#5B21B6',
      light: '#EDE9FE',
    },
    background: {
      default: 'white',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    success: { main: '#10B981' },
    warning: { main: '#F97316' },
    error: { main: '#EF4444' },
    info: { main: '#06B6D4' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
});

export default function MuiProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
