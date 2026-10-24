'use client';

import { useContext, createContext, useState, useEffect } from "react";
import { GetCredentialsFromCookie } from '../utils/AuthUtils';
import { Box, CircularProgress } from "@mui/material";
import QuickTaskApi from "../apis/ApiController";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const clearState = () => { setUser(null); setToken(null); };

  const getToken = async (userId) => {
    try {
      const res = await QuickTaskApi.getToken(userId);
      const { Data } = res;
      if (Data?.rd1?.length && Data?.rd?.length) {
        setUser(Data.rd1[0]);
        setToken(Data.rd[0]);
        return res;
      }
      throw new Error("Invalid token response");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data === 'CHECK_COOKIE_FOR_QUICKTASK') {
            if (!GetCredentialsFromCookie()) clearState();
          }
        };
        window.swChannel = messageChannel;
        registration.active.postMessage('START_TIMER', [messageChannel.port2]);
      }).catch(console.error);
    }
    return () => window.swChannel?.port1?.close?.();
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // ✅ initialize API first — reads sessionStorage, sets headers
        const config = QuickTaskApi.initialize();
        await getToken(config.appUserId);
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isInitialized, clearState }}>
      {!isInitialized
        ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>
        : children
      }
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}