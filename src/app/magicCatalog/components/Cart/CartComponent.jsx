"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, ShoppingCart, Gem, Package, Newspaper, Pencil, Images, ListMusic } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
    Container,
    Grid,
    Typography,
    Button,
    IconButton,
    Box,
    Card,
    CardMedia,
    CardContent,
    Chip,
    Dialog,
    DialogContent,
    TextField,
    CircularProgress,
} from '@mui/material';

import { useCart } from '@mc/context/CartContext';
import { useToast } from '@mc/context/ToastContext';
import { assetPath } from '@mc/utils/paths';
import { SaveCartApi, resolveArticleSelections } from '@mc/app/api/SaveCartApi';
import { callAlbumApi } from '@mc/app/api/albumApi';
import GridBackground from '../Common/GridBackground';
import ReusableConfirmModal from '../Common/modals/ReusableConfirmModal';
import ProductModal from '../Product/ProductModal';
import ArticleDrawer from '../Product/ArticleDrawer';
import FullPageLoader from '../FullPageLoader';

import PageHeader from '../Common/PageHeader';

const LucideIconWrapper = ({ Icon, size = 24, ...props }) => (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }} {...props}>
        <Icon size={size} />
    </Box>
);

const SOURCE_META = {
    design: { label: 'Design', icon: Gem, color: '#7367f0' },
    stock: { label: 'Stock', icon: Package, color: '#0f9d77' },
    article: { label: 'Article', icon: Newspaper, color: '#e8830c' },
};

const CartPageMUI = () => {
    const router = useRouter();
    const { items: cartItems, removeFromCart, addToCart, updateCartItem, clearCart, totalCount, hasHydrated, loading } = useCart();
    const { showSuccess, showInfo, showError } = useToast();
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [confirmModalType, setConfirmModalType] = useState(null);
    const [itemToRemove, setItemToRemove] = useState(null);

    const [imageStates, setImageStates] = useState({});
    const [articleEditItem, setArticleEditItem] = useState(null);

    // Product Modal State
    const [openProductModal, setOpenProductModal] = useState(false);
    const [selectedProductIndex, setSelectedProductIndex] = useState(0);

    const handleClearCart = () => {
        setOpenConfirmModal(true);
        setConfirmModalType('clearCart');
    };

    const handleCloseConfirmModal = () => {
        setOpenConfirmModal(false);
        setConfirmModalType(null);
        setItemToRemove(null);
    };

    const handleConfirmModalConfirm = () => {
        if (confirmModalType === 'clearCart') {
            clearCart();
            showSuccess('Cart cleared successfully');
        } else if (confirmModalType === 'removeItem' && itemToRemove) {
            removeFromCart(itemToRemove);
            showInfo('Item removed from cart');
        }
        setOpenConfirmModal(false);
        setConfirmModalType(null);
        setItemToRemove(null);
    };

    const handleRemoveItem = (id, event) => {
        event.stopPropagation();
        setOpenConfirmModal(true);
        setConfirmModalType('removeItem');
        setItemToRemove(id);
    };

    const handleBack = () => {
        router.push('/magicCatalog/product');
    };

    const handleProductClick = (index) => {
        setSelectedProductIndex(index);
        setOpenProductModal(true);
    };

    // --- Create / Update Album flow ---
    // Album_UniqueName / ProAlbum_Save / ProAlbum_Edit go through the shared
    // CommonAPI via callAlbumApi (app/api/albumApi.js)
    const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'update'
    const [albumName, setAlbumName] = useState('');
    const [albumDate, setAlbumDate] = useState(dayjs());
    const [queryStringId, setQueryStringId] = useState(null);
    const [albumBusy, setAlbumBusy] = useState(null); // 'create' | 'save' | 'savego'
    const [uniqueNameLoading, setUniqueNameLoading] = useState(false);
    const [albumEditId, setAlbumEditId] = useState(null);

    // sessionStorage.albumId is set by the product page's ?albumid loader —
    // its presence means the cart holds album items being edited
    useEffect(() => {
        if (!hasHydrated) return;
        setAlbumEditId(sessionStorage.getItem('albumId'));
    }, [hasHydrated]);

    // Step 1 — SaveQueryStringdesignid, then open the album dialog
    // and prefill the name from Album_UniqueName
    const handleCreateAlbum = async () => {
        if (!cartItems.length || albumBusy) return;
        setAlbumBusy('create');
        try {
            const resolvedItems = await resolveArticleSelections(cartItems);
            const res = await SaveCartApi(resolvedItems);
            const row = res?.data?.rd?.[0] || {};
            const qid = row.QID ?? row.QueryStringid ?? row.id ?? row.ID;
            if (!qid) throw new Error('Could not get the album reference id');
            setQueryStringId(qid);
            setAlbumDate(dayjs());
            setAlbumName('');
            setDialogMode('create');
            setAlbumDialogOpen(true);

            setUniqueNameLoading(true);
            const uniq = await callAlbumApi('Album_UniqueName', '{}', 'Album_UniqueName');
            const uniqRow = uniq?.rd?.[0] || {};
            const suggested =
                uniqRow.AlbumName ?? uniqRow.UniqueName ?? uniqRow.uniquename ?? uniqRow.Name ??
                Object.values(uniqRow).find(v => typeof v === 'string' && v.trim()) ?? '';
            setAlbumName(suggested);
        } catch (err) {
            console.error('CreateAlbum Error:', err);
            showError(err?.message || 'Failed to start album creation');
        } finally {
            setAlbumBusy(null);
            setUniqueNameLoading(false);
        }
    };

    // Update flow — the album's items were loaded into the cart by the
    // product page; re-save them under a fresh QueryStringid, then
    // ProAlbum_Edit attaches it to the existing album
    const handleUpdateAlbum = async () => {
        if (!cartItems.length || albumBusy) return;
        setAlbumBusy('create');
        try {
            const resolvedItems = await resolveArticleSelections(cartItems);
            const res = await SaveCartApi(resolvedItems);
            const row = res?.data?.rd?.[0] || {};
            const qid = row.QID ?? row.QueryStringid ?? row.id ?? row.ID;
            if (!qid) throw new Error('Could not get the album reference id');
            setQueryStringId(qid);
            setAlbumName(sessionStorage.getItem('albumName') || '');
            setAlbumDate(dayjs());
            setDialogMode('update');
            setAlbumDialogOpen(true);
        } catch (err) {
            console.error('UpdateAlbum Error:', err);
            showError(err?.message || 'Failed to start album update');
        } finally {
            setAlbumBusy(null);
        }
    };

    // Step 2 — ProAlbum_Save (create) or ProAlbum_Edit (update)
    const handleAlbumSave = async (goToList = false) => {
        if (!albumName.trim()) {
            showError('Please enter an album name');
            return;
        }
        const isUpdate = dialogMode === 'update';
        setAlbumBusy(goToList ? 'savego' : 'save');
        try {
            const p = isUpdate
                ? JSON.stringify({
                    Article_AlbumManagement_AlbumMasterid: Number(albumEditId) || albumEditId,
                    AlbumName: albumName.trim(),
                    QueryStringid: Number(queryStringId) || queryStringId,
                })
                : JSON.stringify({
                    AlbumName: albumName.trim(),
                    Albumdate: albumDate ? dayjs(albumDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                    QueryStringid: Number(queryStringId) || queryStringId,
                });
            const res = await callAlbumApi(
                isUpdate ? 'ProAlbum_Edit' : 'ProAlbum_Save',
                p,
                isUpdate ? 'ProAlbum_Edit' : 'ProAlbum_Save'
            );
            const row = res?.rd?.[0] || {};
            const msg = row.MSG ?? row.Msg ?? row.message;
            if (msg && String(msg).toLowerCase() !== 'success') {
                throw new Error(String(msg));
            }
            showSuccess(isUpdate ? 'Album updated' : 'Album saved successfully');
            setAlbumDialogOpen(false);
            clearCart();
            sessionStorage.removeItem('albumId');
            sessionStorage.removeItem('albumName');
            router.push(goToList ? '/magicCatalog/albums' : '/magicCatalog');
        } catch (err) {
            console.error(`${isUpdate ? 'ProAlbum_Edit' : 'ProAlbum_Save'} Error:`, err);
            showError(err?.message || 'Failed to save album');
        } finally {
            setAlbumBusy(null);
        }
    };

    const handleCloseAlbumDialog = () => {
        if (albumBusy === 'save' || albumBusy === 'savego') return;
        setAlbumDialogOpen(false);
    };

    const handleArticleEditConfirm = (selectedIds, product) => {
        if (product?.id) {
            updateCartItem(product.id, { selectedArticles: selectedIds, allArticlesSelected: false });
            showSuccess('Article selection updated');
        }
        setArticleEditItem(null);
    };

    // Filter cart items by catalog source (design / stock / article)
    const [sourceFilter, setSourceFilter] = useState(null);
    const cartSources = [...new Set(cartItems.map(i => i.source || 'design'))];
    const visibleCartItems = sourceFilter
        ? cartItems.filter(i => (i.source || 'design') === sourceFilter)
        : cartItems;

    const getImageSrc = (item) => {
        const originalSrc = item.thumbUrl || item.image;
        if (!originalSrc || imageStates[item.id]?.error) return assetPath("/images/image-not-found.jpg");
        return originalSrc;
    };

    // Loading state
    if (!hasHydrated) {
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Container maxWidth="false">
                    <FullPageLoader open={hasHydrated} message="Loading..." subtitle="Please wait while we load your cart" />
                </Container>
            </Box>
        );
    }

    return (
        <GridBackground>
            <Container maxWidth="false" sx={{ position: "relative", zIndex: 2, pb: "110px", px: '0 !important' }}>
                <PageHeader
                    centerTitle="My Cart"
                    centerIcon={ShoppingCart}
                    leftContent={
                        <>
                            <IconButton
                                onClick={handleBack}
                                sx={{
                                    color: 'inherit',
                                }}
                            >
                                <ArrowLeft size={20} />
                            </IconButton>
                            {totalCount > 1 && (
                                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: 'inherit', opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
                                    {totalCount} products
                                </Typography>
                            )}
                            {albumEditId && (
                                <Chip
                                    label="Editing album"
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        bgcolor: 'rgba(115,103,240,0.12)',
                                        color: 'primary.main',
                                        border: '1px solid rgba(115,103,240,0.3)',
                                    }}
                                />
                            )}
                        </>
                    }
                    rightContent={
                        cartItems.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', overflowX: 'auto', maxWidth: { xs: '55vw', sm: 'none' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                                {/* Source filter — only when cart mixes catalogs */}
                                {cartSources.length > 1 && (
                                    <Chip
                                        label={`All ${cartItems.length}`}
                                        size="small"
                                        onClick={() => setSourceFilter(null)}
                                        sx={{
                                            height: 24,
                                            fontWeight: 500,
                                            fontSize: '0.7rem',
                                            borderRadius: 10,
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            bgcolor: !sourceFilter ? 'rgba(115, 103, 240, 0.1)' : 'rgba(0,0,0,0.05)',
                                            color: !sourceFilter ? 'primary.main' : 'text.secondary',
                                            border: !sourceFilter ? '1px solid rgba(115, 103, 240, 0.3)' : '1px solid transparent',
                                            '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.15)' },
                                        }}
                                    />
                                )}
                                {cartSources.length > 1 && cartSources.map(src => {
                                    const meta = SOURCE_META[src] || { label: src, color: '#7367f0' };
                                    const count = cartItems.filter(i => (i.source || 'design') === src).length;
                                    const active = sourceFilter === src;
                                    return (
                                        <Chip
                                            key={src}
                                            label={`${meta.label} ${count}`}
                                            size="small"
                                            onClick={() => setSourceFilter(active ? null : src)}
                                            sx={{
                                                height: 24,
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                bgcolor: active ? `${meta.color}14` : 'rgba(0,0,0,0.05)',
                                                color: active ? meta.color : 'text.secondary',
                                                border: active ? `1px solid ${meta.color}40` : '1px solid transparent',
                                                '&:hover': { bgcolor: `${meta.color}1f` },
                                            }}
                                        />
                                    );
                                })}
                                <Button
                                    onClick={handleClearCart}
                                    size="small"
                                    startIcon={<Trash2 size={16} />}
                                    sx={{
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        borderRadius: 2,
                                        bgcolor: 'rgba(244, 67, 54, 0.08)',
                                        color: 'error.dark',
                                        minWidth: 'auto',
                                        ml: 0.5,
                                        flexShrink: 0,
                                        px: { xs: 1, sm: 2 },
                                        fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                                        '&:hover': {
                                            bgcolor: 'rgba(244, 67, 54, 0.12)',
                                            boxShadow: 'none',
                                        },
                                    }}
                                >
                                    Clear
                                </Button>
                            </Box>
                        )
                    }
                />


                {cartItems.length > 0 ? (
                    <Grid container spacing={2} sx={{ p: '10px 16px !important', mt: 2 }}>
                        {visibleCartItems.map((item, index) => (
                            <Grid
                                key={`${item.id}-${index}`}
                                size={{ xs: 6, sm: 4, md: 3, lg: 3, xl: 2 }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                                    style={{ height: '100%' }}
                                >
                                <Card
                                    onClick={() => handleProductClick(index)}
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                        transition: 'box-shadow 0.3s ease',
                                    }}
                                >
                                    {/* Delete Button */}
                                    <IconButton
                                        onClick={(e) => handleRemoveItem(item.id, e)}
                                        sx={{
                                            position: 'absolute',
                                            bottom: 8,
                                            right: 8,
                                            width: 30,
                                            height: 30,
                                            bgcolor: 'white',
                                            boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                                            zIndex: 10,
                                            '&:hover': { bgcolor: 'error.main', color: 'error.light' },
                                        }}
                                    >
                                        <LucideIconWrapper Icon={Trash2} size={18} />
                                    </IconButton>

                                    {/* Source badge */}
                                    {(() => {
                                        const meta = SOURCE_META[item.source || 'design'];
                                        const SourceIcon = meta?.icon;
                                        return meta ? (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: 8,
                                                    zIndex: 10,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.4,
                                                    bgcolor: `${meta.color}14`,
                                                    color: meta.color,
                                                    px: 0.9,
                                                    py: 0.2,
                                                    borderRadius: 10,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.4px',
                                                    pointerEvents: 'none',
                                                }}
                                            >
                                                {SourceIcon && <SourceIcon size={11} strokeWidth={2.5} />}
                                                {meta.label}
                                            </Box>
                                        ) : null;
                                    })()}
                                    <Box
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            pt: "100%",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            image={getImageSrc(item)}
                                            alt={item.designno}
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                transition: "transform 0.3s",
                                                "&:hover": { transform: "scale(1.1)" },
                                            }}
                                            onError={() =>
                                                setImageStates((prev) => ({
                                                    ...prev,
                                                    [item.id]: { ...(prev[item.id] || {}), error: true },
                                                }))
                                            }
                                        />
                                    </Box>

                                    {/* Product Details */}
                                    <CardContent sx={{ pb: '10px !important', padding: '10px !important', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight="500"
                                            align="center"
                                            className='code'
                                            title={`${item.designno}${item.StockBarcode ? ` · ${item.StockBarcode}` : ''}`}
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                minHeight: '1.4em',
                                            }}
                                        >
                                            {item.designno}{item.StockBarcode ? ` · ${item.StockBarcode}` : ''}
                                        </Typography>
                                        {/* Fixed-height slot — keeps every card the same size */}
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.6, height: 26 }}>
                                            {(item.source === 'article' || item.selectedArticles?.length > 0) && (
                                                <Box
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setArticleEditItem(item);
                                                    }}
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.6,
                                                        px: 1.1,
                                                        py: 0.35,
                                                        borderRadius: 10,
                                                        bgcolor: 'rgba(115, 103, 240, 0.08)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(115, 103, 240, 0.15)',
                                                            transform: 'translateY(-1px)',
                                                        },
                                                    }}
                                                >
                                                    <Newspaper size={12} strokeWidth={2.5} color="#7367f0" />
                                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'primary.dark', lineHeight: 1.2 }}>
                                                        {item.selectedArticles?.length > 0
                                                            ? `${item.selectedArticles.length} article${item.selectedArticles.length === 1 ? '' : 's'}`
                                                            : item.allArticlesSelected
                                                                ? 'All articles'
                                                                : 'Articles'}
                                                    </Typography>
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: '50%',
                                                            bgcolor: 'primary.main',
                                                            color: '#fff',
                                                            ml: 0.2,
                                                            boxShadow: '0 1px 3px rgba(115,103,240,0.35)',
                                                            transition: 'transform 0.2s ease',
                                                            '.MuiBox-root:hover &': { transform: 'scale(1.1)' },
                                                        }}
                                                    >
                                                        <Pencil size={10} strokeWidth={2.5} />
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </CardContent>
                                        </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 8,
                            px: 4,
                            textAlign: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Box
                                sx={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    bgcolor: 'grey.100',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3,
                                }}
                            >
                                <ShoppingCart size={60} color="#9e9e9e" />
                            </Box>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Typography
                                variant="h5"
                                color="text.primary"
                                fontWeight="medium"
                                sx={{ mb: 2 }}
                            >
                                Your cart is empty
                            </Typography>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mb: 4, maxWidth: 400 }}
                            >
                                Looks like you haven't added any items to your cart yet.
                                Start browsing our collection to find something special!
                            </Typography>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => router.push('/magicCatalog/product')}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}
                            >
                                Browse Products
                            </Button>
                        </motion.div>
                    </Box>
                )}

            </Container>

            {/* Bottom action bar — Create Album (same pill style as product page) */}
            {cartItems.length > 0 && (
                <Box sx={{
                    position: "fixed",
                    bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', md: 24 },
                    left: 0,
                    right: 0,
                    px: 2,
                    zIndex: 1000,
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                }}>
                    <Box sx={{
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '30px',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                        p: '6px',
                    }}>
                        <Button
                            variant="contained"
                            onClick={albumEditId ? handleUpdateAlbum : handleCreateAlbum}
                            disabled={albumBusy === 'create'}
                            startIcon={albumBusy === 'create' ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Images size={18} />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '24px',
                                px: 3,
                                py: 1,
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                                boxShadow: '0 4px 12px rgba(115, 103, 240, 0.35)',
                                transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)',
                                    boxShadow: '0 6px 16px rgba(115, 103, 240, 0.45)',
                                    transform: 'translateY(-1px)',
                                },
                            }}
                        >
                            {albumBusy === 'create' ? 'Preparing...' : `${albumEditId ? 'Update' : 'Create'} Album (${totalCount})`}
                        </Button>
                    </Box>
                </Box>
            )}

            <ReusableConfirmModal
                open={openConfirmModal}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmModalConfirm}
                type={confirmModalType} />

            <ProductModal
                open={openProductModal}
                onClose={() => setOpenProductModal(false)}
                product={visibleCartItems[selectedProductIndex]}
                products={visibleCartItems}
                startIndex={selectedProductIndex}
                onAddToCart={addToCart}
                onShowArticles={(prod) => {
                    setOpenProductModal(false);
                    setArticleEditItem(prod);
                }}
                fromCart={true}
            />

            {/* Edit article picks — drawer preloads the item's selectedArticles */}
            <ArticleDrawer
                open={Boolean(articleEditItem)}
                product={articleEditItem}
                onClose={() => setArticleEditItem(null)}
                onConfirm={handleArticleEditConfirm}
                onShowDetails={(prod) => {
                    const idx = visibleCartItems.findIndex((i) => i.id === prod?.id);
                    setArticleEditItem(null);
                    setSelectedProductIndex(Math.max(0, idx));
                    setOpenProductModal(true);
                }}
            />

            {/* Create Album dialog — name (unique-name prefilled) + date + actions */}
            <Dialog
                open={albumDialogOpen}
                onClose={handleCloseAlbumDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, m: 2 } }}
            >
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0,
                            }}
                        >
                            <Images size={18} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', lineHeight: 1.2 }}>
                                {dialogMode === 'update' ? 'Update Album' : 'Create Album'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Save {cartItems.length} item{cartItems.length === 1 ? '' : 's'} {dialogMode === 'update' ? 'to this album' : 'to a new album'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 0 }}>
                    <TextField
                        fullWidth
                        label="Album Name"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                        placeholder="Enter album name"
                        size="small"
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: uniqueNameLoading ? <CircularProgress size={16} /> : null,
                        }}
                        InputLabelProps={{ shrink: true }}
                    />
                    {/* Date is only part of the create payload (ProAlbum_Edit takes no date) */}
                    {dialogMode === 'create' && (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Album Date"
                                value={albumDate}
                                onChange={(newValue) => setAlbumDate(newValue)}
                                format="DD/MM/YYYY"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        InputLabelProps: { shrink: true },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    )}
                </DialogContent>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, px: 2.5, pt: 2.5, pb: 2.5 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseAlbumDialog}
                        disabled={albumBusy === 'save' || albumBusy === 'savego'}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 600,
                            order: { xs: 2, sm: 1 },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleAlbumSave(false)}
                        disabled={Boolean(albumBusy) || uniqueNameLoading}
                        startIcon={albumBusy === 'save' ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : null}
                        sx={{
                            flex: 1,
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 600,
                            order: { xs: 0, sm: 2 },
                            background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                            boxShadow: 'none',
                            '&:hover': { background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)', boxShadow: 'none' },
                        }}
                    >
                        {albumBusy === 'save' ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleAlbumSave(true)}
                        disabled={Boolean(albumBusy) || uniqueNameLoading}
                        startIcon={albumBusy === 'savego' ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <ListMusic size={16} />}
                        sx={{
                            flex: 1,
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 600,
                            order: { xs: 1, sm: 3 },
                            boxShadow: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {albumBusy === 'savego' ? 'Saving...' : 'Save & Go to List'}
                    </Button>
                </Box>
            </Dialog>
        </GridBackground>
    );
};

export default CartPageMUI;