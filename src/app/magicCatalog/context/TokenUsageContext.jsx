"use client";
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { getTokenDetailsApi } from '@mc/app/api/getTokenDetailsApi';
import { getTokenCost } from '@mc/app/api/getTokenMasterApi';

const MAX_TOKENS = 100;

const TokenUsageContext = createContext(null);

export const TokenUsageProvider = ({ children }) => {
    const [usage, setUsage] = useState(0);
    const [maxTokens, setMaxTokens] = useState(MAX_TOKENS);
    const [isLoading, setIsLoading] = useState(false);
    const retryCountRef = useRef(0);
    const requestIdRef = useRef(0);
    // Dedup concurrent fetches — StrictMode double-mounts effects in dev,
    // which would otherwise fire the API twice per mount
    const inFlightRef = useRef(null);
    const autoFetchedRef = useRef(false);   // mount effect fires once per provider lifetime
    const hasLoadedRef = useRef(false);     // first successful response

    const fetchTokens = useCallback(async () => {
        if (inFlightRef.current) return inFlightRef.current;
        const promise = (async () => {
            const currentRequestId = ++requestIdRef.current;
            setIsLoading(true);
            const data = await getTokenDetailsApi();
            if (currentRequestId !== requestIdRef.current) return;
            if (data) {
                setUsage(data.tokenUsed);
                setMaxTokens(data.totalToken || MAX_TOKENS);
                retryCountRef.current = 0;
                hasLoadedRef.current = true;
                setIsLoading(false);
            } else if (retryCountRef.current < 3) {
                retryCountRef.current++;
                // Keep isLoading true through the retry chain so the badge
                // skeleton doesn't flash once per retry attempt
                setTimeout(() => fetchTokens(), 1500);
            } else {
                setIsLoading(false);
            }
        })();
        inFlightRef.current = promise;
        try {
            return await promise;
        } finally {
            if (inFlightRef.current === promise) inFlightRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (autoFetchedRef.current) return;
        autoFetchedRef.current = true;
        fetchTokens();
    }, [fetchTokens]);

    const setTokenData = useCallback((data) => {
        if (data) {
            setUsage(data.tokenUsed);
            setMaxTokens(data.totalToken || MAX_TOKENS);
        }
    }, []);

    const incrementUsage = useCallback((amount = 1) => {
        setUsage(prev => Math.min(prev + amount, maxTokens));
    }, [maxTokens]);

    const refreshTokens = useCallback(() => {
        fetchTokens();
    }, [fetchTokens]);

    const remaining = Math.max(0, maxTokens - usage);

    const hasEnoughTokens = useCallback((eventName) => {
        const cost = getTokenCost(eventName);
        return remaining >= cost;
    }, [remaining]);

    const value = {
        usage,
        remaining,
        maxTokens,
        incrementUsage,
        refreshTokens,
        setTokenData,
        isLoading,
        hasTokens: remaining > 0,
        hasEnoughTokens,
    };

    return (
        <TokenUsageContext.Provider value={value}>
            {children}
        </TokenUsageContext.Provider>
    );
};

export const useTokenUsage = () => {
    const ctx = useContext(TokenUsageContext);
    if (!ctx) {
        throw new Error('useTokenUsage must be used within TokenUsageProvider');
    }
    return ctx;
};
