"use client";
import React from 'react';
import Link from 'next/link';
import { assetPath } from '@mc/utils/paths';
import { Box, Typography, Container } from '@mui/material';
import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                width: '100%',
                py: 2,
                background: 'linear-gradient(to bottom, transparent, rgba(115, 103, 240, 0.05))',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                mt: 6,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
            <Container maxWidth={false} sx={{ maxWidth: '100%', px: { xs: 2, md: 4 } }}>
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'grid' },
                        gridTemplateColumns: { md: '1fr auto 1fr' },
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: { xs: 1, md: 0 },
                        position: 'relative',
                        zIndex: 1,
                        minHeight: 48
                    }}
                >
                    {/* Left Section: Powered by */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'default' }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.disabled', letterSpacing: 0.3 }}
                                >
                                    Powered by
                                </Typography>
                                <Box
                                    component="img"
                                    src={assetPath("/images/poweredBy.png")}
                                    alt="Optigo"
                                    width={86}
                                    height={44}
                                    sx={{ objectFit: 'contain', display: 'block' }}
                                />
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Center Section: Copyright */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.disabled',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Copyright © 2026 OptigoAI. All rights reserved.
                    </Typography>

                    {/* Right Section: Privacy link */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link href="/magicCatalog/privacy-policy" style={{ textDecoration: 'none' }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.disabled',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s ease',
                                    '&:hover': { color: 'primary.main' }
                                }}
                            >
                                Privacy Policy
                            </Typography>
                        </Link>
                    </Box>
                </Box>
            </Container>
            </motion.div>

            {/* Decorative background element */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '100px',
                    background: 'radial-gradient(ellipse at center, rgba(115, 103, 240, 0.15) 0%, transparent 70%)',
                    zIndex: 0,
                    filter: 'blur(40px)',
                    opacity: 0.8
                }}
            />
        </Box>
    );
};

export default Footer;
