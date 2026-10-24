'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getConfigFlagApi } from '@mc/app/api/getConfigApi';
import { setEncryptedSession, getEncryptedSession } from '@mc/utils/encryption';
import { bridgeSession } from '@mc/utils/sessionBridge';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [configFlags, setConfigFlags] = React.useState(null);

  // Read auth data from sessionStorage (set by the main app from URL params)
  const getQueryParams = () => {
    if (typeof window === 'undefined') return null;
    try {
      const authQueryParams =
        sessionStorage.getItem("AuthqueryParams") ||
        localStorage.getItem("AuthqueryParams");
      return authQueryParams ? JSON.parse(authQueryParams) : null;
    } catch (error) {
      console.error("Error parsing AuthData:", error);
      return null;
    }
  };

  // Helper function to check config flags
  const getConfigFlag = (flagName) => {
    if (!configFlags) {
      const cachedFlags = getEncryptedSession('configFlags');
      return cachedFlags?.[flagName] || '0';
    }
    return configFlags[flagName] || '0';
  };

  // Helper function to check if flag is enabled (value is '1')
  const isConfigEnabled = (flagName) => {
    return getConfigFlag(flagName) === '1';
  };

  useEffect(() => {
    const existing = sessionStorage.getItem("urlParams");
    const flags = existing ? existing.split(',') : [];
    if (searchParams.get('FE') && !flags.includes('fe')) {
      flags.push('fe');
    }
    if ((searchParams.get('PD') || searchParams.get('pd')) && !flags.includes('pd')) {
      flags.push('pd');
    }
    if (flags.length) {
      sessionStorage.setItem("urlParams", flags.join(','));
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const initAuth = () => {
      if (pathname === '/magicCatalog/error_404') {
        setIsAuthReady(true);
        return;
      }
      if (typeof window !== 'undefined') {
        // Bridge the main app's URL params (stored in sessionStorage) to
        // the magicCatalog format (AuthqueryParams, taskInit).
        // The main app stores: token, SV, version, SpVer, yearCode, AppVer
        bridgeSession();

        const params = getQueryParams();
        if (params) {
          setIsAuthReady(true);
        } else {
          // No session data available — still allow rendering but APIs will be skipped
          setIsAuthReady(true);
        }
      }
    };

    initAuth();
  }, [pathname]);

  // Fetch config flags when auth is ready
  useEffect(() => {
    const fetchConfigFlags = async () => {
      if (!isAuthReady) return;

      try {
        const response = await getConfigFlagApi();

        if (response?.rd) {
          const flagsObject = response.rd.reduce((acc, item) => {
            acc[item.key] = item.Value;
            return acc;
          }, {});

          setConfigFlags(flagsObject);
          setEncryptedSession('configFlags', flagsObject);
        }
      } catch (error) {
        console.error('Error fetching config flags:', error);
      }
    };

    fetchConfigFlags();
  }, [isAuthReady]);

  // Prevent app rendering until auth check is finalized
  if (!isAuthReady && pathname !== '/magicCatalog/error_404') {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        getQueryParams,
        isAuthReady,
        configFlags,
        getConfigFlag,
        isConfigEnabled
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
