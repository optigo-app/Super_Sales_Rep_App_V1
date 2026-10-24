"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Gem, Package, Newspaper, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CARDS = [
    {
        id: "design",
        title: "Designs",
        desc: "Full design catalog — browse, search & pick styles",
        icon: Gem,
        color: "#7367f0",
        gradient: "linear-gradient(150deg, rgba(115,103,240,0.14) 0%, rgba(115,103,240,0.04) 55%, rgba(255,255,255,0) 100%)",
    },
    {
        id: "stock",
        title: "Stock",
        desc: "Ready stock with barcodes — scan or search to pick",
        icon: Package,
        color: "#00cfe8",
        gradient: "linear-gradient(150deg, rgba(0,207,232,0.14) 0%, rgba(0,207,232,0.04) 55%, rgba(255,255,255,0) 100%)",
    },
    {
        id: "article",
        title: "Articles",
        desc: "Pick a design, then attach its article variants",
        icon: Newspaper,
        color: "#ff9f43",
        gradient: "linear-gradient(150deg, rgba(255,159,67,0.14) 0%, rgba(255,159,67,0.04) 55%, rgba(255,255,255,0) 100%)",
    },
];

const formatCount = (n) => {
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L+`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
    return `${n}`;
};

export default function CatalogLanding({ counts = {}, loading = {}, onSelect, isProAlbum = true }) {
    const cards = isProAlbum ? CARDS : CARDS.filter((c) => c.id === 'design');
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 1.5,
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(3, minmax(0, 1fr))',
                    },
                    gap: { xs: 2, sm: 3 },
                    width: '100%',
                    justifyContent: 'center',
                }}
            >
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    const count = formatCount(counts[card.id]);
                    const isLoading = loading[card.id] && !counts[card.id];
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.08 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -6 }}
                            whileTap={{ scale: 0.97 }}
                            style={{ height: '100%' }}
                        >
                            <Box
                                onClick={() => onSelect?.(card.id)}
                                sx={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '20px',
                                    p: { xs: 2.5, md: 3 },
                                    height: '100%',
                                    minHeight: { xs: 190, md: 225 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    bgcolor: 'background.paper',
                                    border: '1px solid rgba(0,0,0,0.07)',
                                    boxShadow: '0 6px 18px rgba(31, 41, 55, 0.06)',
                                    transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                                    '&:hover': {
                                        borderColor: `${card.color}55`,
                                        boxShadow: `0 16px 34px ${card.color}26`,
                                    },
                                    '&:hover .cta-arrow': { transform: 'translateX(4px)' },
                                    '&:hover .card-icon': { transform: 'scale(1.06) rotate(-4deg)' },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        background: card.gradient,
                                        pointerEvents: 'none',
                                    },
                                    // decorative blurred blob
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        width: 140,
                                        height: 140,
                                        borderRadius: '50%',
                                        bgcolor: card.color,
                                        opacity: 0.1,
                                        filter: 'blur(30px)',
                                        top: -50,
                                        right: -40,
                                        pointerEvents: 'none',
                                    },
                                }}
                            >
                                <Box
                                    className="card-icon"
                                    sx={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${card.color}1f`,
                                        border: `1px solid ${card.color}33`,
                                        mb: 2,
                                        transition: 'transform 0.25s ease',
                                    }}
                                >
                                    <Icon size={22} color={card.color} strokeWidth={2} />
                                </Box>

                                <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.2rem' }, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                                    {card.title}
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        color: card.color,
                                        mt: 0.3,
                                        minHeight: '1.1em',
                                        opacity: isLoading ? 0.55 : 1,
                                    }}
                                >
                                    {isLoading ? 'Loading…' : count ? `${count} items` : ''}
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        color: 'text.secondary',
                                        mt: 0.6,
                                        lineHeight: 1.5,
                                        flex: 1,
                                    }}
                                >
                                    {card.desc}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: card.color }}>
                                        Browse {card.title}
                                    </Typography>
                                    <Box
                                        className="cta-arrow"
                                        sx={{ display: 'flex', transition: 'transform 0.2s ease' }}
                                    >
                                        <ArrowRight size={16} color={card.color} strokeWidth={2.5} />
                                    </Box>
                                </Box>
                            </Box>
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}
