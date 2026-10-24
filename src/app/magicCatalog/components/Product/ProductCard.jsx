"use client";

import React, { useState, useMemo, useEffect, lazy, Suspense, startTransition } from 'react';
import {
    Card,
    CardMedia,
    Button,
    Box,
    Skeleton,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemText,
    useTheme
} from '@mui/material';

import { ShoppingCart, ScanSearch, Check, Newspaper, Eye, Trash2 } from 'lucide-react';
const ProductModal = lazy(() => import('./ProductModal'));
import { useCart } from '@mc/context/CartContext';
import { useToast } from '@mc/context/ToastContext';
import { assetPath } from '@mc/utils/paths';

const ProductCard = React.memo(function ProductCard({
    product,
    products = [],
    index = 0,
    onSearchSimilar,
    onShowArticles,
    showSimilarButton = true,
    urlParamsFlag,
    isMultiSelectMode,
    isSelected,
    onToggleSelection
}) {
    const theme = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const { addToCart, removeFromCart, items: cartItems } = useCart();
    const { showSuccess, showInfo } = useToast();

    const isInCart = useMemo(() => {
        return cartItems.some(item => item.id === product.id);
    }, [cartItems, product.id]);

    const handleToggleCart = (productToToggle) => {
        if (!productToToggle || !productToToggle.id) return;
        const isProductInCart = cartItems.some(item => item.id === productToToggle.id);
        if (isProductInCart) {
            showInfo('Item removed from cart');
            // Low-priority update — the click handler shouldn't wait for the
            // full grid re-render that the cart context change triggers
            startTransition(() => removeFromCart(productToToggle.id));
        } else {
            showSuccess('Item added to cart');
            startTransition(() => addToCart(productToToggle));
        }
    };

    const displayTitle = useMemo(
        () => product?.producttype || product?.type || "",
        [product]
    );

    const displayCategory = useMemo(
        () => product?.categoryname || product?.category || product?.categoryName || "",
        [product]
    );

    const displayDesignNo = useMemo(
        // Stock rows can repeat designno — append StockBarcode to stay unique.
        // Article rows are per-variant — ArticleMasterCode is the unique label.
        () => product?.StockBarcode
            ? `${product?.designno || ""} · ${product.StockBarcode}`
            : product?.source === 'article' && product?.articlemastercode
                ? product.articlemastercode
                : product?.designno || "",
        [product]
    );

    const imageSrc = useMemo(() => {
        if (imageError) return assetPath("/images/image-not-found.jpg");
        if (product?.thumbUrl) return product.thumbUrl;
        if (product?.image) return product.image;
        return assetPath("/images/image-not-found.jpg");
    }, [imageError, product]);

    // Reset image state when the product changes — reused card instances
    // (same id across catalogs) must not keep a stale skeleton/error
    useEffect(() => {
        setImageError(false);
        setIsImageLoaded(false);
    }, [product?.thumbUrl, product?.image, product?.id]);

    const hasSimilarSearchImage = useMemo(() => {
        return Boolean(product?.originalUrl || product?.image || product?.thumbUrl);
    }, [product]);

    // Context menu (right-click)
    const [contextMenu, setContextMenu] = useState(null);

    // Dynamic icon stacking — no reserved gap when an icon isn't rendered
    const canShowSimilar = Boolean(showSimilarButton && onSearchSimilar && hasSimilarSearchImage);
    // Articles action: article-catalog rows always; design rows only when
    // the design actually has article variants (HasArticle flag)
    const productHasArticles = product?.source === 'article'
        || Number(product?.HasArticle ?? product?.hasarticle ?? 0) === 1;
    const canShowArticles = Boolean(onShowArticles) && productHasArticles;
    const iconTop = isMultiSelectMode ? 44 : 8;
    const articlesTop = iconTop + (canShowSimilar ? 40 : 0);

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu(
            contextMenu === null
                ? { mouseX: e.clientX + 2, mouseY: e.clientY - 6 }
                : null
        );
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleCardClick = (e) => {
        if (isMultiSelectMode) {
            e.stopPropagation();
            onToggleSelection(product?.id, index, e);
        } else if (canShowArticles) {
            // Article view — card click opens the article picker;
            // product details are reachable via the drawer's detail icon
            onShowArticles(product);
        } else {
            setOpenModal(true);
        }
    };


    return (
        <Box
            data-product-id={product?.id}
            data-product-index={index}
            sx={{ position: 'relative', height: '100%', zIndex: 1 }}
            onMouseEnter={() => {
                setIsHovered(true);
                import('./ProductModal');
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card
                onClick={handleCardClick}
                onContextMenu={handleContextMenu}
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: isHovered
                        ? '0 12px 32px rgba(0,0,0,0.08)'
                        : '0 2px 12px rgba(0,0,0,0.04)',
                    transform: isHovered && !isMultiSelectMode ? 'translateY(-4px)' : 'translateY(0)',
                    height: '100%',
                }}
            >
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>

                    {/* IMAGE WRAPPER */}
                    <Box sx={{ width: "100%", pt: "100%", position: "relative" }}>

                        {/* SKELETON SHIMMER */}
                        {!isImageLoaded && !imageError && (
                            <Skeleton
                                variant="rectangular"
                                animation="wave"
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "4px",
                                    bgcolor: 'grey.100'
                                }}
                            />
                        )}

                        {/* REAL IMAGE */}
                        <CardMedia
                            component="img"
                            loading="lazy"
                            image={imageSrc}
                            alt={displayTitle || displayCategory}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onLoad={() => setIsImageLoaded(true)}
                            onError={() => {
                                setImageError(true);
                                setIsImageLoaded(true);
                            }}
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                opacity: isImageLoaded ? 1 : 0,
                                transition: "opacity 0.5s ease-out, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                                transform: isHovered && !isMultiSelectMode ? 'scale(1.06)' : 'scale(1)',
                            }}
                        />
                    </Box>

                    {/* DESIGN NUMBER CHIP - Top Left */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: -5,
                            zIndex: 2,
                            bgcolor: 'rgba(230, 230, 230, 0.2)',
                            color: 'text.secondary',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            pointerEvents: 'none',
                            transition: 'opacity 0.3s ease',
                            opacity: isHovered ? 0.7 : 1,
                        }}
                    >
                        {displayDesignNo}
                    </Box>

                    {/* CHECKMARK CIRCLE - Multi-Select Mode */}
                    {isMultiSelectMode && (
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelection(product?.id, index, e);
                            }}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 3,
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isSelected ? 'primary.main' : 'rgba(255, 255, 255, 0.95)',
                                border: isSelected ? 'none' : '2px solid rgba(0, 0, 0, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: 'none',
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                },
                                '&:active': {
                                    transform: 'scale(0.95)',
                                }
                            }}
                        >
                            {isSelected && (
                                <Check size={18} color="white" strokeWidth={3} />
                            )}
                        </Box>
                    )}

                    {/* IN CART BADGE */}
                    {isInCart && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 28,
                                left: 5,
                                zIndex: 2,
                                bgcolor: 'rgba(115, 103, 240, 0.15)',
                                backdropFilter: 'blur(4px)',
                                color: 'primary.main',
                                p: 0.8,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                boxShadow: '0 2px 8px rgba(115, 103, 240, 0.1)'
                            }}
                        >
                            <ShoppingCart size={14} strokeWidth={2.5} />
                        </Box>
                    )}

                    {/* SEARCH SIMILAR BUTTON */}
                    {canShowSimilar && (
                        <Tooltip title="Search Similar Design" placement="left">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSearchSimilar(product);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: iconTop,
                                    right: 8,
                                    color: "#555",
                                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(4px)',
                                    opacity: isHovered ? 1 : 0,
                                    visibility: isHovered ? 'visible' : 'hidden',
                                    transform: isHovered ? 'translateY(0)' : 'translateY(-10px)',
                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 1)',
                                        color: "#7367f0",
                                        transform: 'scale(1.12)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    },
                                    zIndex: 2
                                }}
                            >
                                <ScanSearch size={18} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* ARTICLES BUTTON */}
                    {canShowArticles && (
                        <Tooltip title="View Articles" placement="left">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShowArticles(product);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: articlesTop,
                                    right: 8,
                                    color: "#555",
                                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(4px)',
                                    opacity: isHovered ? 1 : 0,
                                    visibility: isHovered ? 'visible' : 'hidden',
                                    transform: isHovered ? 'translateY(0)' : 'translateY(-10px)',
                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 1)',
                                        color: "#7367f0",
                                        transform: 'scale(1.12)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    },
                                    zIndex: 2
                                }}
                            >
                                <Newspaper size={18} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* HOVER OVERLAY - Removed gradient, just button slide-up */}
                    {!isMultiSelectMode && (
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenModal(true);
                            }}
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                transform: isHovered ? 'translateY(0)' : 'translateY(102%)',
                                transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                zIndex: 2,
                            }}
                        >
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<ShoppingCart size={18} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCart(product);
                                }}
                                sx={{
                                    background: isInCart ? theme.gradients?.secondary : theme.gradients?.primary,
                                    color: "white",
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    py: 1.25,
                                    borderRadius: 0,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: isInCart ? theme.gradients?.secondary : theme.gradients?.primary,
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                            >
                                {isInCart ? "Remove from Cart" : "Add to Cart"}
                            </Button>
                        </Box>
                    )}

                    {/* CLICK OVERLAY FOR MULTI-SELECT — removed: only the checkbox toggles selection */}
                </Box>
            </Card>

            {/* RIGHT-CLICK CONTEXT MENU — card-style */}
            <Menu
                open={contextMenu !== null}
                onClose={closeContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            minWidth: 200,
                            overflow: 'visible',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            '& .MuiList-root': { p: 0.75 },
                            '& .MuiMenuItem-root': {
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                gap: 1.25,
                                py: 0.8,
                                px: 1,
                                borderRadius: 1.5,
                                transition: 'background 0.15s ease',
                                '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.08)' },
                            },
                        },
                    },
                }}
            >
                {/* Menu header — which product */}
                <Box
                    sx={{
                        px: 1.25,
                        pt: 0.75,
                        pb: 1,
                        mb: 0.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.7px', color: 'text.disabled', textTransform: 'uppercase' }}>
                        Design
                    </Box>
                    <Box sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                        {displayDesignNo || 'Product'}
                    </Box>
                </Box>

                {[
                    {
                        key: 'details',
                        label: 'View Details',
                        icon: <Eye size={15} />,
                        show: true,
                        onClick: () => setOpenModal(true),
                    },
                    {
                        key: 'similar',
                        label: 'Search Similar',
                        icon: <ScanSearch size={15} />,
                        show: canShowSimilar,
                        onClick: () => onSearchSimilar(product),
                    },
                    {
                        key: 'articles',
                        label: 'View Articles',
                        icon: <Newspaper size={15} />,
                        show: canShowArticles,
                        onClick: () => onShowArticles(product),
                    },
                    {
                        key: 'cart',
                        label: isInCart ? 'Remove from Cart' : 'Add to Cart',
                        icon: isInCart ? <Trash2 size={15} /> : <ShoppingCart size={15} />,
                        show: true,
                        danger: isInCart,
                        onClick: () => handleToggleCart(product),
                    },
                ].filter(i => i.show).map((item) => (
                    <MenuItem
                        key={item.key}
                        onClick={() => {
                            closeContextMenu();
                            item.onClick();
                        }}
                    >
                        <Box
                            sx={{
                                width: 26,
                                height: 26,
                                borderRadius: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                bgcolor: item.danger ? 'rgba(244, 67, 54, 0.1)' : 'rgba(115, 103, 240, 0.1)',
                                color: item.danger ? 'error.main' : 'primary.main',
                            }}
                        >
                            {item.icon}
                        </Box>
                        <ListItemText
                            primaryTypographyProps={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: item.danger ? 'error.main' : 'text.primary',
                            }}
                        >
                            {item.label}
                        </ListItemText>
                    </MenuItem>
                ))}
            </Menu>

            {openModal && (
                <Suspense fallback={null}>
                    <ProductModal
                        open={openModal}
                        onClose={() => { setOpenModal(false); setIsHovered(false) }}
                        product={product}
                        products={products}
                        startIndex={index}
                        onAddToCart={handleToggleCart}
                        isInCart={isInCart}
                        onSearchSimilar={onSearchSimilar}
                        onShowArticles={onShowArticles}
                        showSimilarButton={showSimilarButton}
                        urlParamsFlag={urlParamsFlag}
                    />
                </Suspense>
            )}
        </Box>
    );
});

export default ProductCard;
