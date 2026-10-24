"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Container,
    Box,
    Typography,
    Button,
    IconButton,
    Grid,
    Paper,
    CircularProgress,
    Dialog,
    DialogContent,
} from "@mui/material";
import { ArrowLeft, ShoppingCart, Images, FileText, Sparkles, PackageCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

import { useCart } from "@mc/context/CartContext";
import { useToast } from "@mc/context/ToastContext";
// import { buildQuoteRedirectUrl } from "@mc/utils/globalFunc";
import { SaveCartApi } from "@mc/app/api/SaveCartApi";
import { getDesignArticlesApi } from "@mc/app/api/articleCollectionApi";
import { getEncryptedSession } from "@mc/utils/encryption";
import GridBackground from "../Common/GridBackground";
import PageHeader from "../Common/PageHeader";

const ACTION_CONFIG = {
    album: {
        title: "Add to Album",
        description: "Add these items to your album for future reference and inspiration",
        api: SaveCartApi,
        successMessage: "Items added to Album!",
        postMessageEvent: "Album",
        responseKey: "QID",

        ui: {
            icon: <Images size={32} />,
            iconBg: "linear-gradient(135deg, #ff9f43 0%, #ff6b00 100%)",
            cardBg: "linear-gradient(135deg, #fff7ed 0%, #fff0df 100%)",
            buttonBg: "linear-gradient(135deg, #ff9f43 0%, #ff6b00 100%)",
            buttonHover: "linear-gradient(135deg, #ff8c1a 0%, #e65b00 100%)",
        },
    },

    quote: {
        title: "Add to Quote",
        description: "Add these items to your quotation for future reference and inspiration",
        api: SaveCartApi,
        successMessage: "Items added to Quotation!",
        postMessageEvent: "Quotation",
        responseKey: "QID",

        ui: {
            icon: <FileText size={32} />,
            iconBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            cardBg: "linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)",
            buttonBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            buttonHover: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
        },
    },

    order: {
        title: "Add to Order",
        description: "Add these items to your order for future reference and inspiration",
        api: SaveCartApi,
        successMessage: "Items added to Order!",
        postMessageEvent: "Order",
        responseKey: "QID",

        ui: {
            icon: <ShoppingCart size={32} />,
            iconBg: "linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%)",
            cardBg: "linear-gradient(135deg, #f0fff7 0%, #e3fff1 100%)",
            buttonBg: "linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%)",
            buttonHover: "linear-gradient(135deg, #14c79a 0%, #0f9b77 100%)",
        },
    },

    pdOrder: {
        title: "Move to PD Order",
        description: "Move these items to your PD order for processing",
        api: SaveCartApi,
        successMessage: "Items moved to PD Order!",
        postMessageEvent: "pdOrderNew",
        responseKey: "QID",
        sendImages: true,

        ui: {
            icon: <PackageCheck size={32} />,
            iconBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            cardBg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
            buttonBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            buttonHover: "linear-gradient(135deg, #5457e0 0%, #4338ca 100%)",
        },
    },
};

const sendPostMessage = (event, code, images = null) => {
    const albumId = sessionStorage.getItem("albumId");
    const isProAlbum = getEncryptedSession('configFlags')?.IsProAlbum === '1';
    const payload = {
        code,
        action: albumId ? "edit" : "add",
        IsProAlbum: isProAlbum ? '1' : '0',
    };
    if (albumId) payload.albumid = albumId;
    if (images) payload.images = images;
    const message = {
        type: "ADD_TAB",
        evt: event,
        payload,
    };
    console.log("postMessage sent:", message);
    window.parent.postMessage(message, "*");
    if (albumId) sessionStorage.removeItem("albumId");
};

const ActionCard = ({ actionKey, config, loading, onClick, index = 0, restricted = false }) => {
    const { title, description, ui } = config;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%' }}
        >
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                background: ui.cardBg,
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.08)",
                transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                opacity: restricted ? 0.65 : 1,
                filter: restricted ? 'saturate(0.6)' : 'none',
                "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.1)",
                },
            }}
        >
            <Box sx={{ textAlign: "center", mb: 2 }}>
                <Box
                    sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: ui.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        color: "white",
                        transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    {React.cloneElement(ui.icon, { size: 24 })}
                </Box>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, fontSize: "1rem" }}>
                    {title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
                    {description}
                </Typography>

                {restricted && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'inline-block',
                            mt: 1,
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 5,
                            bgcolor: 'rgba(255, 159, 67, 0.14)',
                            color: '#e65b00',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            border: '1px solid rgba(255, 159, 67, 0.3)',
                        }}
                    >
                        Design items only
                    </Typography>
                )}
            </Box>

            <Box>
                <Button
                    fullWidth
                    variant="contained"
                    size="medium"
                    onClick={onClick}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <Sparkles size={16} />}
                    sx={{
                        py: 1,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        background: ui.buttonBg,
                        "&:hover": { background: ui.buttonHover, transform: "translateY(-1px)" },
                        "&:active": { transform: "scale(0.98)" },
                        boxShadow: "none",
                        transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    {loading ? "Processing..." : `Continue`}
                </Button>
            </Box>
        </Paper>
        </motion.div>   
    );
};

// "All articles" direct-adds carry no picks — fetch every articlemastercode
// via getarticle so the save payload sends real codes like explicit picks
const resolveArticleSelections = async (items) => {
    const needsFetch = (item) =>
        item.source === 'article' && item.allArticlesSelected && !(item.selectedArticles?.length);
    if (!items.some(needsFetch)) return items;

    const cache = new Map();
    const fetchArticles = (designno) => {
        if (!cache.has(designno)) {
            cache.set(
                designno,
                getDesignArticlesApi(designno).then((res) => res?.rd || []).catch(() => [])
            );
        }
        return cache.get(designno);
    };

    return Promise.all(
        items.map(async (item) => {
            if (!needsFetch(item)) return item;
            const rows = await fetchArticles(item.designno);
            const selectedArticles = rows.map((row, i) => ({
                id: `art:${row.autocode ?? item.designno}:${row.ArticleNo ?? i}`,
                articleno: row.ArticleNo,
                articlemastercode: row.ArticleMasterCode ?? row.articlemastercode ?? row.ArticleNo,
            }));
            return selectedArticles.length
                ? { ...item, selectedArticles, allArticlesSelected: false }
                : item;
        })
    );
};

const CheckoutClient = () => {
    const router = useRouter();
    const { items: cartItems } = useCart();
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState({});
    const [restrictedDialog, setRestrictedDialog] = useState(null); // { title }

    const isPDFlag = typeof window !== 'undefined' && sessionStorage.getItem("urlParams")?.includes('pd');

    const totalItems = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const hasNonDesignItems = (cartItems || []).some((i) => (i.source || 'design') !== 'design');
    const isActionSupported = (key) => !hasNonDesignItems || key === 'album';
    const handleBack = () => router.push("/magicCatalog/cart");

    const handleAction = async (actionKey) => {
        const config = ACTION_CONFIG[actionKey];
        if (!config) return;

        if (!isActionSupported(actionKey)) {
            setRestrictedDialog({ title: config.title });
            return;
        }

        setLoading((p) => ({ ...p, [actionKey]: true }));

        try {
            const resolvedItems = await resolveArticleSelections(cartItems);
            const response = await config.api(resolvedItems);
            showSuccess(config.successMessage);

            const code = response?.data?.rd?.[0]?.[config.responseKey];
            const curVersion = cartItems[0]?.cuVer
            // const url = buildQuoteRedirectUrl(code, curVersion)
            if (code) {
                if (config.sendImages) {
                    const images = cartItems
                        .map(item => item.originalUrl || item.image || item.thumbUrl)
                        .filter(Boolean);
                    sendPostMessage(config.postMessageEvent, code, images);
                } else {
                    sendPostMessage(config.postMessageEvent, code);
                }
            }
            
        } catch (err) {
            console.error(err);
            showError(err?.message || "Something went wrong.");
        } finally {
            setLoading((p) => ({ ...p, [actionKey]: false }));
        }
    };

    return (
        <GridBackground>
            <Container maxWidth={false} sx={{ position: "relative", zIndex: 2, px: '0 !important' }}>
                <PageHeader
                    centerTitle="Checkout"
                    centerIcon={ShoppingCart}
                    leftContent={
                        <>
                            <IconButton onClick={handleBack}>
                                <ArrowLeft size={20} />
                            </IconButton>
                            {totalItems > 1 && (
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                    {totalItems} products
                                </Typography>
                            )}
                        </>
                    }
                />
                <Box
                    sx={{
                        maxWidth: 1500,
                        mx: "auto",
                        mt: 4,
                        p: { xs: 2, sm: 3, md: 4, lg: 6 },
                        borderRadius: 4,
                        bgcolor: "rgba(255,255,255,0.6)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
                        border: "1px solid rgba(255,255,255,0.8)",
                    }}
                >
                    <Grid container spacing={2} justifyContent="center">
                        {Object.entries(ACTION_CONFIG)
                            .filter(([key]) => key !== 'pdOrder' || isPDFlag)
                            .map(([key, cfg], index) => (
                            <Grid key={key} size={{ xs: 12, sm: 6, md: isPDFlag ? 3 : 4 }}>
                                <ActionCard
                                    actionKey={key}
                                    config={cfg}
                                    loading={!!loading[key]}
                                    onClick={() => handleAction(key)}
                                    index={index}
                                    restricted={hasNonDesignItems && !isActionSupported(key)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>

            {/* Restricted-action notice */}
            <Dialog
                open={Boolean(restrictedDialog)}
                onClose={() => setRestrictedDialog(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255, 159, 67, 0.14)',
                            color: '#e65b00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        <AlertTriangle size={24} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                        {restrictedDialog?.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                        This action currently supports design items only. Your cart contains stock/article items — add them to an Album, or remove them to continue here.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setRestrictedDialog(null)}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                        >
                            Got it
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => {
                                setRestrictedDialog(null);
                                handleAction('album');
                            }}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 600,
                                background: ACTION_CONFIG.album.ui.buttonBg,
                                '&:hover': { background: ACTION_CONFIG.album.ui.buttonHover },
                                boxShadow: 'none',
                            }}
                        >
                            Add to Album
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </GridBackground>
    );
};

export default CheckoutClient;
