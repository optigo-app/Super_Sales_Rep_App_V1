'use client';

import React from 'react';
import Image from 'next/image';
import {
    Box,
    Typography,
    Paper,
    Container,
    Button
} from '@mui/material';
import { ShieldCheck, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const UnauthorizedPage = () => {
    return (
        <Box
            sx={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                position: 'relative',
                overflow: 'hidden',
                background: 'radial-gradient(circle at 50% 30%, #f6f4ff 0%, #f3f4f6 60%, #eef0f4 100%)',
            }}
        >
            {/* Decorative blobs */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 380,
                    height: 380,
                    borderRadius: '50%',
                    bgcolor: '#7367f0',
                    opacity: 0.07,
                    filter: 'blur(70px)',
                    top: -120,
                    right: -100,
                    pointerEvents: 'none',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    bgcolor: '#00cfe8',
                    opacity: 0.06,
                    filter: 'blur(70px)',
                    bottom: -110,
                    left: -90,
                    pointerEvents: 'none',
                }}
            />

            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, sm: 5, md: 6 },
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            borderRadius: 6,
                            boxShadow: '0 24px 50px -12px rgba(115, 103, 240, 0.15), 0 8px 16px -8px rgba(0,0,0,0.06)',
                            backgroundColor: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        {/* Brand mark + status icon fused in one mark */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <Image
                                    src="./favicon.svg"
                                    alt="Optigo AI Studio"
                                    width={64}
                                    height={64}
                                    priority
                                    style={{ borderRadius: '50%' }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: -6,
                                        bottom: -4,
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2.5px solid #fff',
                                        boxShadow: '0 2px 8px rgba(115, 103, 240, 0.35)',
                                    }}
                                >
                                    <ShieldCheck size={13} color="#fff" strokeWidth={2.4} />
                                </Box>
                            </Box>
                        </Box>

                        {/* Copy */}
                        <Typography
                            component="h1"
                            sx={{
                                fontWeight: 800,
                                color: 'text.primary',
                                mb: 1.5,
                                fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
                                lineHeight: 1.2,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Sign in required
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: 'text.secondary',
                                maxWidth: 400,
                                mx: 'auto',
                                lineHeight: 1.65,
                                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                            }}
                        >
                            Optigo AI Studio opens from your Optigo workspace.
                            Your session may have expired or this page was opened directly.
                            Sign in to continue where you left off.
                        </Typography>

                        {/* CTA */}
                        <Button
                            href="https://login.optigoapps.com/Default.do"
                            variant="contained"
                            endIcon={<ArrowRight size={18} strokeWidth={2.5} />}
                            startIcon={<LogIn size={17} strokeWidth={2.2} />}
                            sx={{
                                mt: 4,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                px: 4,
                                py: 1.4,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                                boxShadow: '0 8px 20px rgba(115, 103, 240, 0.35)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)',
                                    boxShadow: '0 10px 26px rgba(115, 103, 240, 0.45)',
                                    transform: 'translateY(-1px)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Go to Optigo Login
                        </Button>

                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 3,
                                color: 'text.disabled',
                                fontSize: '0.72rem',
                            }}
                        >
                            Having trouble? Contact your administrator or Optigo support.
                        </Typography>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default function App() {
    return (
        <Box sx={{ fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif' }}>
            <UnauthorizedPage />
        </Box>
    );
}
