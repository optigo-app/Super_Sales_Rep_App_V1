"use client";
import React from 'react';
import { Box, Typography, Tooltip, Skeleton } from '@mui/material';
import { Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenUsage } from '@mc/context/TokenUsageContext';

const TokenBadge = ({ onUpgrade }) => {
    const { remaining, maxTokens, isLoading } = useTokenUsage();
    const ratio = maxTokens > 0 ? Math.max(0, Math.min(1, remaining / maxTokens)) : 0;
    const isLow = remaining <= 20;
    const isCritical = remaining <= 5;

    const tokenColor = isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#7367f0';
    const barGradient = isCritical
        ? 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'
        : isLow
            ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
            : 'linear-gradient(90deg, #8b82f5 0%, #7367f0 100%)';

    return (
        <Tooltip
            title={`${remaining} of ${maxTokens} AI credits remaining`}
            arrow
            placement="bottom"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
                <Box
                    onClick={onUpgrade}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.9,
                        borderRadius: 10,
                        pl: 0.6,
                        pr: 1.1,
                        py: 0.45,
                        bgcolor: '#fff',
                        border: '1px solid',
                        borderColor: isCritical ? 'rgba(239, 68, 68, 0.3)' : isLow ? 'rgba(245, 158, 11, 0.3)' : 'rgba(115, 103, 240, 0.22)',
                        boxShadow: '0 1px 3px rgba(31, 41, 55, 0.06)',
                        cursor: onUpgrade ? 'pointer' : 'default',
                        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                        '&:hover': onUpgrade ? {
                            borderColor: tokenColor,
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(115, 103, 240, 0.15)',
                        } : {},
                    }}
                >
                    {/* Gradient icon tile */}
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background: isCritical
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : isLow
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                        }}
                    >
                        <Sparkles size={13} color="#fff" strokeWidth={2} />
                    </Box>

                    {/* Count + slim usage bar */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4, lineHeight: 1 }}>
                            {isLoading ? (
                                <Skeleton variant="text" width={42} height={14} sx={{ borderRadius: 1 }} />
                            ) : (
                                <>
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        <motion.span
                                            key={remaining}
                                            initial={{ y: 6, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -6, opacity: 0 }}
                                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ display: 'inline-flex' }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: 'text.primary',
                                                    lineHeight: 1,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}
                                            >
                                                {remaining}
                                            </Typography>
                                        </motion.span>
                                    </AnimatePresence>
                                    <Typography
                                        sx={{
                                            fontSize: 10.5,
                                            fontWeight: 500,
                                            color: 'text.secondary',
                                            lineHeight: 1,
                                            display: { xs: 'none', sm: 'inline' },
                                        }}
                                    >
                                        credits left
                                    </Typography>
                                </>
                            )}
                        </Box>
                        {/* Usage meter — slim gradient bar */}
                        <Box
                            sx={{
                                mt: 0.45,
                                width: '100%',
                                height: 3.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(31, 41, 55, 0.08)',
                                overflow: 'hidden',
                                display: { xs: 'none', sm: 'block' },
                            }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    width: `${ratio * 100}%`,
                                    borderRadius: 2,
                                    background: barGradient,
                                    transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1), background 0.3s ease',
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Upgrade pill — appears only when low */}
                    {(isLow || isCritical) && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{ display: 'flex' }}
                        >
                            <Box
                                sx={{
                                    display: { xs: 'none', md: 'flex' },
                                    alignItems: 'center',
                                    gap: 0.35,
                                    borderRadius: 7,
                                    px: 0.8,
                                    py: 0.3,
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <TrendingUp size={11} strokeWidth={2.5} />
                                Upgrade
                            </Box>
                        </motion.div>
                    )}
                </Box>
            </motion.div>
        </Tooltip>
    );
};

export default TokenBadge;
