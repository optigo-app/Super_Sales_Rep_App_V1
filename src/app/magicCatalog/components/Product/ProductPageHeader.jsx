"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    Typography,
    Fade,
    Chip,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    useTheme,
} from "@mui/material";
import { ChevronLeft, ChevronRight, Filter, Grid3x3, List, BarChart3, RefreshCw, ArrowLeft } from "lucide-react";
import PageHeader from "@mc/components/Common/PageHeader";
import FilterChips from "@mc/components/Product/FilterChips";
import TokenBadge from "@mc/components/Common/TokenBadge";
import CatalogViewToggle from "@mc/components/Product/CatalogViewToggle";

export default function ProductPageHeader({
    // Multi-select props
    isMultiSelectMode,
    selectedCount,
    isAllSelected,
    onCancelMultiSelect,
    onSelectAllToggle,
    onDeselectAll,
    onBulkAddToCart,
    onToggleMultiSelectMode,
    onBulkRemoveFromCart,
    isRemovalMode,
    newItemsCount,

    // Navigation/Cart props
    onHomeClick,
    onOpenCart,
    totalCartItems,

    // Filter/Search props
    productCount,
    appliedFilters,
    searchTerm,
    onRemoveFilter,
    onClearSearchTerm,
    onClearAllFilters,
    onFilterPopoverOpen,
    isFilterOpen, // New prop
    searchMode,
    onFilterClick,

    // Catalog view props
    catalogView,
    onCatalogViewChange,
    onReloadCatalog,
    showCatalogToggle = true,

    // View mode props
    viewMode,
    onViewModeChange,

    // Summary props
    showSummary,
    onToggleSummary,

    // Token usage
    tokenUsage = 0,
    maxTokens = 100,
    onTokenUpgrade,
}) {
    const theme = useTheme();
    // Filter Chips Scroll State
    const filterScrollRef = useRef(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);
    const [isClearAllInside, setIsClearAllInside] = useState(true);
    const [catalogMenuPos, setCatalogMenuPos] = useState(null); // {left, top} for context menu

    const checkScrollButtons = useCallback(() => {
        if (filterScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
            setShowLeftScroll(scrollLeft > 0);
            setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
            const hasOverflow = scrollWidth > clientWidth + 2;
            setIsClearAllInside(!hasOverflow);
        }
    }, []);

    useEffect(() => {
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        const transitionTimer = setTimeout(() => {
            checkScrollButtons();
        }, 450);

        return () => {
            window.removeEventListener('resize', checkScrollButtons);
            clearTimeout(transitionTimer);
        };
    }, [checkScrollButtons, appliedFilters, searchTerm, isFilterOpen]);

    const scrollFilters = (direction) => {
        if (filterScrollRef.current) {
            const scrollAmount = 400;
            filterScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkScrollButtons, 300);
        }
    };

    return (
        <PageHeader
            layout="fluid"
            sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                // ...(isMultiSelectMode ? {
                //     bgcolor: 'rgba(115, 103, 240, 0.08)',
                //     borderBottom: '1px solid rgba(115, 103, 240, 0.15)',
                //     boxShadow: '0 4px 20px rgba(115, 103, 240, 0.08)',
                // } : {})
            }}
            leftContent={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        onClick={onHomeClick}
                        aria-label="Go back"
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: '#fff',
                            boxShadow: '0 2px 8px rgba(124,58,237,0.15)',
                            flexShrink: 0,
                            '&:active': { transform: 'scale(0.9)' },
                            transition: 'transform 0.15s',
                        }}
                    >
                        <ArrowLeft size={20} color="#1F2937" />
                    </IconButton>
                    <Box sx={{
                        transition: 'opacity 0.2s ease',
                        opacity: isMultiSelectMode ? 0.6 : 1,
                        minWidth: 0,
                    }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: '1rem', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
                            {isMultiSelectMode ? 'Selection Mode' : 'Magic Catalog / AI'}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, color: "text.secondary", whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                            {isMultiSelectMode ? `${selectedCount} selected` : `${productCount} products`}
                        </Typography>
                    </Box>
                </Box>
            }
            centerContent={
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    minWidth: 0,
                    position: "relative",
                    transition: 'all 0.3s ease',
                }}>
                    {/* Stays interactive in select mode — needed for cross-catalog selection */}
                    {showCatalogToggle && (
                        <Box
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setCatalogMenuPos({ left: e.clientX, top: e.clientY });
                            }}
                            sx={{
                                flex: { xs: 1, lg: '0 0 auto' },
                                display: 'flex',
                                justifyContent: { xs: 'center', lg: 'flex-start' },
                                minWidth: 0,
                            }}
                        >
                            <CatalogViewToggle
                                catalogView={catalogView}
                                onCatalogViewChange={onCatalogViewChange}
                                sx={{ mr: { xs: 0, sm: 1.5 } }}
                            />
                        </Box>
                    )}
                    <Menu
                        open={Boolean(catalogMenuPos)}
                        onClose={() => setCatalogMenuPos(null)}
                        anchorReference="anchorPosition"
                        anchorPosition={catalogMenuPos || undefined}
                        PaperProps={{
                            sx: {
                                borderRadius: 2,
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                minWidth: 170,
                                py: 0.5,
                            }
                        }}
                    >
                        {['design', 'stock', 'article'].map((view) => (
                            <MenuItem
                                key={view}
                                onClick={() => {
                                    setCatalogMenuPos(null);
                                    onReloadCatalog?.(view);
                                }}
                                sx={{
                                    px: 1.5,
                                    py: 0.8,
                                    mx: 0.5,
                                    borderRadius: 1.5,
                                    gap: 0.75,
                                    color: view === catalogView ? 'primary.main' : 'text.primary',
                                    bgcolor: view === catalogView ? 'rgba(115, 103, 240, 0.08)' : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.10)' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: '0px !important', mr: 1, color: 'inherit' }}>
                                    <RefreshCw size={15} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={`Reload ${view.charAt(0).toUpperCase() + view.slice(1)}`}
                                    primaryTypographyProps={{
                                        fontSize: '0.82rem',
                                        fontWeight: view === catalogView ? 600 : 500,
                                        letterSpacing: '0.01em',
                                    }}
                                />
                            </MenuItem>
                        ))}
                    </Menu>
                    {/* Filter summary chip removed — the top-right filter icon (with badge)
                        opens the filter panel instead */}
                    <Fade in={showLeftScroll && !isMultiSelectMode}>
                        <IconButton
                            size="small"
                            onClick={() => scrollFilters('left')}
                            sx={{
                                p: 0.5,
                                mr: 0.5,
                                display: { xs: 'none', lg: 'inline-flex' },
                                flexShrink: 0,
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <ChevronLeft size={16} />
                        </IconButton>
                    </Fade>

                    <Box
                        className="filterScrollBox"
                        ref={filterScrollRef}
                        onScroll={checkScrollButtons}
                        sx={{
                            display: { xs: 'none', lg: 'flex' },
                            gap: { xs: 0.75, sm: 1 },
                            overflowX: "auto",
                            scrollbarWidth: "none",
                            "&::-webkit-scrollbar": { display: "none" },
                            alignItems: "center",
                            flex: 1,
                            scrollBehavior: "smooth",
                            p: 0.5,
                            WebkitMaskImage: `linear-gradient(to right, ${showLeftScroll ? 'transparent' : '#000'} ${showLeftScroll ? '0' : '0'}, #000 ${showLeftScroll ? '16px' : '0'}, #000 calc(100% - ${showRightScroll ? '16px' : '0px'}), ${showRightScroll ? 'transparent' : '#000'})`,
                            maskImage: `linear-gradient(to right, ${showLeftScroll ? 'transparent' : '#000'} 0, #000 ${showLeftScroll ? '16px' : '0'}, #000 calc(100% - ${showRightScroll ? '16px' : '0px'}), ${showRightScroll ? 'transparent' : '#000'})`,
                            transition: 'all 0.3s ease',
                            opacity: isMultiSelectMode ? 0.5 : 1,
                            pointerEvents: isMultiSelectMode ? 'none' : 'auto',
                            filter: isMultiSelectMode ? 'blur(1px)' : 'none'
                        }}
                    >
                        {searchTerm && (
                            <Chip
                                key="drawer-search"
                                label={`Search: ${searchTerm}`}
                                size="small"
                                onDelete={onClearSearchTerm}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: 'rgba(115, 103, 240, 0.08)',
                                    color: 'primary.dark',
                                    border: '1px solid rgba(115, 103, 240, 0.18)',
                                    flexShrink: 0,
                                    maxWidth: { xs: 130, sm: 240 },
                                    '& .MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    },
                                    '&:hover': {
                                        bgcolor: 'rgba(115, 103, 240, 0.12)',
                                    }
                                }}
                            />
                        )}
                        <FilterChips
                            appliedFilters={appliedFilters}
                            onRemoveFilter={onRemoveFilter}
                            onFilterPopoverOpen={onFilterPopoverOpen}
                        />

                        {appliedFilters.length > 0 && isClearAllInside && (
                            <Button
                                variant="text"
                                size="small"
                                onClick={onClearAllFilters}
                                sx={{
                                    textTransform: "none",
                                    fontSize: 12.5,
                                    color: 'text.primary',
                                    whiteSpace: "nowrap",
                                    minWidth: "auto",
                                    flexShrink: 0,
                                    textDecoration: 'underline',
                                    padding: '5px 10px',
                                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                    '&:hover': {
                                        bgcolor: theme.palette.primary.danger,
                                        color: '#fff'
                                    }
                                }}
                            >
                                Clear
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>&nbsp;All</Box>
                            </Button>
                        )}
                    </Box>

                    <Fade in={showRightScroll && !isMultiSelectMode}>
                        <IconButton
                            size="small"
                            onClick={() => scrollFilters('right')}
                            sx={{
                                p: 0.5,
                                ml: 0.5,
                                display: { xs: 'none', lg: 'inline-flex' },
                                flexShrink: 0,
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <ChevronRight size={16} />
                        </IconButton>
                    </Fade>
                </Box>
            }
            rightContent={
                <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center', flexWrap: 'nowrap' }}>
                    {/* Summary Toggle (only in list view) */}
                    {/* {!isMultiSelectMode && viewMode === 'list' && (
                        <Tooltip title={showSummary ? "Hide summary" : "Show summary"}>
                            <IconButton
                                size="small"
                                onClick={onToggleSummary}
                                sx={{
                                    borderRadius: 1.5,
                                    bgcolor: showSummary ? 'primary.main' : 'rgba(0, 0, 0, 0.04)',
                                    color: showSummary ? 'white' : 'text.secondary',
                                    '&:hover': {
                                        bgcolor: showSummary ? 'primary.dark' : 'rgba(0, 0, 0, 0.08)'
                                    }
                                }}
                            >
                                <BarChart3 size={18} />
                            </IconButton>
                        </Tooltip>
                    )} */}

                    {/* View Mode Toggle */}
                    {/* {!isMultiSelectMode && (
                        <Box
                            sx={{
                                display: 'flex',
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                                borderRadius: 2,
                                p: 0.5,
                                mr: 1
                            }}
                        >
                            <IconButton
                                size="small"
                                onClick={() => onViewModeChange('grid')}
                                sx={{
                                    borderRadius: 1.5,
                                    bgcolor: viewMode === 'grid' ? 'white' : 'transparent',
                                    color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                                    boxShadow: viewMode === 'grid' ? 1 : 0,
                                    '&:hover': {
                                        bgcolor: viewMode === 'grid' ? 'white' : 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <Grid3x3 size={18} />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => onViewModeChange('list')}
                                sx={{
                                    borderRadius: 1.5,
                                    bgcolor: viewMode === 'list' ? 'white' : 'transparent',
                                    color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                                    boxShadow: viewMode === 'list' ? 1 : 0,
                                    '&:hover': {
                                        bgcolor: viewMode === 'list' ? 'white' : 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <List size={18} />
                            </IconButton>
                        </Box>
                    )} */}

                    {!isMultiSelectMode && (
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <TokenBadge onUpgrade={onTokenUpgrade} />
                        </Box>
                    )}
                    {!isMultiSelectMode && (
                        <Tooltip title={isFilterOpen ? "Close filters" : "Filters"}>
                            <IconButton
                                onClick={onFilterClick}
                                aria-label="Toggle filters"
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    color: '#fff',
                                    background: isFilterOpen
                                        ? 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)'
                                        : 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                                    boxShadow: '0 4px 12px rgba(115, 103, 240, 0.35)',
                                    position: 'relative',
                                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:active': { transform: 'scale(0.92)' },
                                }}
                            >
                                <Filter size={18} />
                                {(appliedFilters.length > 0 || searchTerm) && (
                                    <Box
                                        component="span"
                                        sx={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            minWidth: 18,
                                            height: 18,
                                            px: 0.5,
                                            borderRadius: '9px',
                                            bgcolor: '#ea5455',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            lineHeight: 1,
                                            border: '2px solid #fff',
                                        }}
                                    >
                                        {appliedFilters.length + (searchTerm ? 1 : 0)}
                                    </Box>
                                )}
                            </IconButton>
                        </Tooltip>
                    )}
                    {/* Multi-select actions live in the bottom action bar (ProductClient) */}
                </Box>
            }
        />
    );
}
