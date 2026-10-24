"use client";

import React from "react";
import { Box, Button, Tooltip } from "@mui/material";
import { Gem, Package, Newspaper } from "lucide-react";
import { motion } from "framer-motion";

const VIEWS = [
    { id: "design", label: "Designs", icon: <Gem size={14} /> },
    { id: "stock", label: "Stock", icon: <Package size={14} /> },
    { id: "article", label: "Articles", icon: <Newspaper size={14} /> },
];

export default function CatalogViewToggle({ catalogView, onCatalogViewChange, sx = {} }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: { xs: 0.25, sm: 0.5 },
                p: { xs: 0.3, sm: 0.4 },
                borderRadius: "20px",
                bgcolor: "rgba(115, 103, 240, 0.06)",
                border: "1px solid rgba(115, 103, 240, 0.12)",
                flexShrink: 0,
                ...sx,
            }}
        >
            {VIEWS.map((view) => {
                const isActive = catalogView === view.id;
                return (
                    <motion.div key={view.id} whileTap={{ scale: 0.96 }}>
                        <Tooltip title={`Show ${view.label} catalog`}>
                            <Button
                                onClick={() => onCatalogViewChange?.(view.id)}
                                startIcon={view.icon}
                                disableRipple
                                size="small"
                                sx={{
                                    px: { xs: 1, sm: 1.8 },
                                    py: { xs: 0.3, sm: 0.5 },
                                    minHeight: { xs: "26px", sm: "30px" },
                                    borderRadius: "16px",
                                    textTransform: "none",
                                    fontSize: { xs: "0.66rem", sm: "0.75rem" },
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? "#fff" : "text.primary",
                                    background: isActive
                                        ? "linear-gradient(135deg, #7367f0 0%, #5e50ee 100%)"
                                        : "transparent",
                                    boxShadow: isActive
                                        ? "0 4px 12px rgba(115, 103, 240, 0.3)"
                                        : "none",
                                    transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                                    "&:hover": {
                                        background: isActive
                                            ? "linear-gradient(135deg, #7367f0 0%, #5e50ee 100%)"
                                            : "rgba(115, 103, 240, 0.1)",
                                        color: isActive ? "#fff" : "primary.main",
                                    },
                                    "& .MuiButton-startIcon": { marginRight: "5px" },
                                }}
                            >
                                {view.label}
                            </Button>
                        </Tooltip>
                    </motion.div>
                );
            })}
        </Box>
    );
}
