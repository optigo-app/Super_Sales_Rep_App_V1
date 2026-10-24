"use client";
import React, { useState, useEffect } from "react";
import { logErrorToServer } from "@mc/utils/errorLogger";
import { Box, Typography, Container, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ModernSearchBar from "../ModernSearchBar";
import { ArrowLeft, ArrowRight, BadgeDollarSign, Layers, Play, Video } from "lucide-react";
import Image from "next/image";
import { scrollToSectionWithHighlight } from "@mc/utils/globalFunc";
import { SearchModeToggle } from "../Common/HomeCommon";
import dynamic from "next/dynamic";
import ContinuousTypewriter from "../Common/ContinuousTypewriter";
import { useProductData } from "@mc/context/ProductDataContext";
import { useAuth } from "@mc/context/AuthContext";
import { preloadService } from "@mc/services/apiService";
import GridBackground from "../Common/GridBackground";
import FullPageLoader from "../FullPageLoader";
import { AiMaintenanceModal, AiSubscriptionModal, AiTrainingModal } from "../Common/modals";
import HowItWorks from "./HowItWorks";
import Footer from "../Common/Footer";

const GradientWaves = dynamic(
    () => import("../animation/GradientWaves").then((mod) => mod.GradientWaves),
    { ssr: false }
);

console.log("Home page log")

// --- ANIMATION CONFIG ---
const floatAnimation = {
    animate: {
        y: [0, -15, 0],
        rotate: [0, 4, 0],
        scale: [1, 1.02, 1]
    },
    transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

// --- COMPONENTS ---

const TypewriterText = ({ text }) => {
    const words = text.split(" ");

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.025, delayChildren: 0.03 * i },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", damping: 12, stiffness: 200 }
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: { type: "spring", damping: 12, stiffness: 200 }
        },
    };

    return (
        <motion.span
            style={{ display: "inline" }}
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {words.map((word, wordIndex) => (
                <React.Fragment key={wordIndex}>
                    <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                        {Array.from(word).map((letter, letterIndex) => (
                            <motion.span
                                variants={child}
                                key={letterIndex}
                                style={{ display: "inline-block" }}
                            >
                                {letter}
                            </motion.span>
                        ))}
                    </span>
                    {wordIndex < words.length - 1 && " "}
                </React.Fragment>
            ))}
        </motion.span>
    );
};

const upcomingFeatures = [
    "ERP Intelligence on Your Private Cloud",
    "Search by Photo",
    "Hybrid Search: Text + Images",
    "Build & Share Smart Catalog Albums",
    "Book Sales Orders in Seconds"
];

const typeWriterText = [
    "Private-Cloud ERP Intelligence",
    "Find Products by Photo",
    "Hybrid Search Across Text & Images",
    "Create & Share Catalog Albums",
    "Instant Sales Order Booking",
];

const Home = () => {
    const router = useRouter();
    const theme = useTheme();
    const isMobileBar = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedMode, setSelectedMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('searchMode') || 'design';
        }
        return 'design';
    });
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [featureIndex, setFeatureIndex] = useState(0);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [showTrainingModal, setShowTrainingModal] = useState(false);
    const [helpStep, setHelpStep] = useState(0);
    const [isSearchFocus, setIsSearchFocus] = useState(true);

    // Use product data context
    const { productData, isLoading: isLoadingProducts, fetchProductData, setPendingSearch } = useProductData();
    const { isAuthReady, getConfigFlag, isConfigEnabled } = useAuth();


    const handleBack = () => {
        router.push('/');
    };

    useEffect(() => {
        if (selectedMode) {
            sessionStorage.setItem('searchMode', selectedMode);
        }
    }, [selectedMode]);

    useEffect(() => {
        if (!upcomingFeatures.length) return;
        const interval = setInterval(() => {
            setFeatureIndex((prev) => (prev + 1) % upcomingFeatures.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    // Fetch product data on mount
    useEffect(() => {
        if (isAuthReady) {
            fetchProductData();
            router.prefetch("/magicCatalog/product");
        }
    }, [fetchProductData, isAuthReady, router]);

    // Fire-and-forget preload API call on page load (non-blocking, independent)
    useEffect(() => {
        preloadService();
    }, []);

    const handleSearch = (searchData) => {
        try {
            // Check config flags if AI mode is selected
            if (selectedMode === 'ai') {
                // Check IsAiMaintenance first
                if (isConfigEnabled('IsAiMaintenance')) {
                    setShowMaintenanceModal(true);
                    return;
                }
                // Check IsAiEnable (when enabled, show subscription modal)
                if (isConfigEnabled('IsAiEnable')) {
                    setShowSubscriptionModal(true);
                    return;
                }
                // Check IsAiReady (when enabled, show training modal)
                if (isConfigEnabled('IsAiReady')) {
                    setShowTrainingModal(true);
                    return;
                }
            }

            const searchPayload = {
                ...searchData,
                mode: selectedMode,
                timestamp: Date.now(),
                filters: appliedFilters,
            };

            // Instant state update and redirect
            setPendingSearch(searchPayload);
            setIsRedirecting(true);
            router.push("/magicCatalog/product");
        } catch (error) {
            setIsRedirecting(false);
            console.error("handleSearch Error:", error);
            logErrorToServer({
                shortReason: "Search execution failed on Home",
                detailedReason: error
            });
        }
    };

    const handleSuggestionClick = (suggestion) => {
        try {
            // Create filter object based on suggestion
            const filter = {
                category: suggestion.filterCategory,
                item: {
                    id: `suggestion-${suggestion.type}-${Date.now()}`,
                    name: suggestion.value
                }
            };

            // Navigate to product page with filter applied
            const searchPayload = {
                isSearchFlag: 0, // No API search, just filter
                mode: selectedMode,
                timestamp: Date.now(),
                filters: [filter],
            };

            setPendingSearch(searchPayload);
            setIsRedirecting(true);
            router.push("/magicCatalog/product");
        } catch (error) {
            setIsRedirecting(false);
            console.error("handleSuggestionClick Error:", error);
            logErrorToServer({
                shortReason: "Search suggestion navigation failed",
                detailedReason: error
            });
        }
    };

    const handleScrollToHowItWorks = () => {
        scrollToSectionWithHighlight('how-it-works-section', 10);
    };

    const handleSearchFocus = () => {
        scrollToSectionWithHighlight('search-section', 500);
        setSelectedMode("ai");
        setIsSearchFocus(false);
        setTimeout(() => {
            setIsSearchFocus(true);
        }, 50);
    };

    return (
        <GridBackground>
            <Box sx={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                display: { xs: 'flex', md: 'block' },
                flexDirection: 'column',
                minHeight: '85dvh'
            }}>
                {/* Back Button - Fixed position on mobile */}
                <IconButton
                    onClick={handleBack}
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#fff',
                        boxShadow: '0 2px 8px rgba(124,58,237,0.15)',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        position: 'fixed',
                        left: 12,
                        top: 12,
                        zIndex: 300,
                        '&:active': { transform: 'scale(0.9)' },
                        transition: 'transform 0.15s',
                    }}
                >
                    <ArrowLeft size={20} color="#1F2937" />
                </IconButton>
                <GradientWaves />
                {isRedirecting && <FullPageLoader open={true} showLogo={selectedMode === 'ai'} message="Start Searching..." subtitle="Please wait while we find your results." />}
                <Box
                    sx={{
                        position: 'absolute',
                        top: { xs: 16, md: 16 },
                        right: { xs: 16, md: 16 },
                        zIndex: 100,
                        display: { xs: 'none', sm: 'block' }
                    }}
                >
                    <Box
                        onClick={handleScrollToHowItWorks}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: 'white',
                            color: 'text.primary',
                            px: 2,
                            py: 1,
                            borderRadius: '30px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            animation: 'pulseHighlight 2s infinite',
                            '@keyframes pulseHighlight': {
                                '0%': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    transform: 'scale(1)',
                                    borderColor: 'rgba(0,0,0,0.05)'
                                },
                                '50%': {
                                    boxShadow: '0 0 20px rgba(115,103,240,0.4)',
                                    transform: 'scale(1.05)',
                                    borderColor: 'rgba(115,103,240,0.3)'
                                },
                                '100%': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    transform: 'scale(1)',
                                    borderColor: 'rgba(0,0,0,0.05)'
                                }
                            },

                            '&:hover': {
                                transform: 'translateY(-2px) scale(1.05)',
                                boxShadow: '0 8px 25px rgba(115,103,240,0.2)',
                                bgcolor: '#fdfdff',
                                animation: 'none'
                            }
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                                color: '#7367f0'
                            }}
                        >
                            <Play size={16} fill="#7367f0" />
                            <Typography variant="button" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' }}>
                                How it works?
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                height: 18,
                                px: 1,
                                borderRadius: '10px',
                                bgcolor: 'rgba(115,103,240,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid rgba(115,103,240,0.2)'
                            }}
                        >
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#7367f0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Video Guides
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* --- ANIMATED BLOBS (Side Accents) --- */}
                <motion.div
                    {...floatAnimation}
                    style={{
                        position: "absolute",
                        top: "5%",
                        left: "10%",
                        width: "350px",
                        height: "350px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(115,103,240,0.25) 0%, rgba(162,155,254,0.15) 100%)",
                        filter: "blur(80px)",
                        zIndex: 0
                    }}
                />
                <motion.div
                    animate={{ y: [0, 40, 0], x: [0, -40, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        bottom: "10%",
                        right: "10%",
                        width: "400px",
                        height: "400px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(255,100,100,0.15) 0%, rgba(255,159,67,0.1) 100%)",
                        filter: "blur(90px)",
                        zIndex: 0
                    }}
                />

                <Container
                    maxWidth={false}
                    sx={{
                        position: "relative",
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: { xs: 'center', md: 'flex-start' },
                        flex: { xs: 1, md: 'unset' },
                        mt: { xs: 0, sm: 6 },
                        px: { xs: 0, sm: 2 },
                    }}
                >

                    {/* --- BRANDING --- */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: 'center',
                            gap: 1.5,
                            mb: { xs: 2.5, sm: 4 },
                        }}
                    >

                        <Image
                            src="favicon.svg"
                            alt="Magic Catalog"
                            width={45}
                            height={45}
                            priority
                            draggable={false}
                            style={{
                                borderRadius: '50%',
                            }}
                            onDragStart={(e) => e.preventDefault()}
                        />
                    </Box>

                    {/* Feature Badge */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        sx={{
                            mb: { xs: 2.5, sm: 4 },
                            px: { xs: 1.5, sm: 2 },
                            py: { xs: 0.8, sm: 1.1 },
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            background: "rgba(255,255,255,0.45)",
                            backdropFilter: "blur(15px)",
                            maxWidth: { xs: '95%', sm: 720 },
                            mx: 'auto',
                            overflow: 'hidden',
                        }}
                    >
                        <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                <Box
                                    sx={{
                                        px: 0.8,
                                        py: 0.25,
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        letterSpacing: 0.4,
                                        textTransform: 'uppercase',
                                        background: 'rgba(129,140,248,0.10)',
                                        color: '#4f46e5',
                                        border: '1px solid rgba(129,140,248,0.40)'
                                    }}
                                >
                                    New
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: { xs: 11, sm: 13 },
                                        fontWeight: 500,
                                        color: '#475569',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: { xs: '62vw', sm: 'none' },
                                    }}
                                >
                                    {upcomingFeatures[featureIndex]}
                                </Typography>
                                <ArrowRight size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Hero Text */}
                    <Box sx={{ mb: 4, textAlign: "center", px: { xs: 1.5, sm: 0 } }}>
                        <Typography
                            variant="h1"
                            fontWeight="600"
                            sx={{
                                fontSize: { xs: "1.35rem", sm: "2rem", md: "3rem" },
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                px: { xs: 1, sm: 0 },
                                mb: { xs: 1, sm: 1.5 },
                                letterSpacing: { xs: "-0.3px", sm: "-1px" },
                                lineHeight: { xs: 1.3, sm: 1.2 },
                                color: "#475569",
                                opacity: 0.9,
                            }}
                        >
                            <TypewriterText text="Cloud AI — Built Deep Into Your Business." />
                        </Typography>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, maxWidth: 600, mx: "auto", fontSize: { xs: "0.85rem", sm: "1.1rem" }, opacity: 0.8, minHeight: "1.5rem", px: { xs: 2, sm: 0 } }}>
                                <ContinuousTypewriter texts={typeWriterText} />
                            </Typography>
                        </motion.div>
                    </Box>

                    {/* Mode Selection Toggle */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                    >
                        <SearchModeToggle
                            activeMode={selectedMode}
                            onModeChange={setSelectedMode}
                            onMaintenanceClick={() => setShowMaintenanceModal(true)}
                            onSubscriptionClick={() => setShowSubscriptionModal(true)}
                            onTrainingClick={() => setShowTrainingModal(true)}
                            isConfigEnabled={isConfigEnabled}
                        />
                    </Box>

                    {/* Search Bar - fixed at bottom on mobile/tablet like ChatGPT */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6, type: "spring", stiffness: 100 }}
                        sx={{
                            width: "100%",
                            position: { xs: 'fixed', md: 'relative' },
                            bottom: { xs: 0, md: 'auto' },
                            left: { xs: 0, md: 'auto' },
                            right: { xs: 0, md: 'auto' },
                            zIndex: { xs: 1200, md: 'auto' },
                            px: { xs: 1.5, sm: 2, md: 0 },
                            pt: { xs: 3, md: 0 },
                            pb: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 10px)', md: 0 },
                            background: {
                                xs: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 35%, #ffffff 100%)',
                                md: 'none'
                            },
                        }}
                        id="search-section"
                    >
                        <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%' }}>
                        <ModernSearchBar
                            onSubmit={handleSearch}
                            onMaintenanceClick={() => setShowMaintenanceModal(true)}
                            appliedFilters={appliedFilters}
                            onApply={setAppliedFilters}
                            initialExpanded={true}
                            alwaysExpanded={true}
                            showMoreFiltersButton={false}
                            showSuggestions={true}
                            productData={productData}
                            onSuggestionClick={handleSuggestionClick}
                            autoFocus={isSearchFocus}
                            externalLoading={isLoadingProducts}
                            isLoading={isRedirecting}
                            searchMode={selectedMode}
                            onImageUpload={() => setSelectedMode('ai')}
                            suggestionPosition={isMobileBar ? 'top' : 'bottom'}
                        />
                        </Box>
                    </Box>

                    {/* Help Video Cards (Pills) */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 1.5,
                            mt: 2,
                            px: 2
                        }}
                    >
                        {[
                            // { id: 0, label: "Search by Image", icon: <Play size={14} /> },
                            // { id: 1, label: "Search by Text", icon: <Layers size={14} /> },
                            // { id: 2, label: "Remove Background", icon: <BadgeDollarSign size={14} /> },
                            { id: 0, label: "Watch All Help Guides", icon: <Video size={14} /> }
                        ].map((card, index) => (
                            <Box
                                key={index}
                                onClick={() => {
                                    setHelpStep(card.id);
                                    scrollToSectionWithHighlight('how-it-works-section', 10);
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: '20px',
                                    bgcolor: 'rgba(255, 255, 255, 0.4)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.6)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                                    '&:hover': {
                                        bgcolor: 'rgba(115, 103, 240, 0.08)',
                                        borderColor: 'rgba(115, 103, 240, 0.3)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 15px rgba(115, 103, 240, 0.1)',
                                        '& .card-text': { color: '#7367f0' },
                                        '& .card-icon': { color: '#7367f0', transform: 'scale(1.1)' }
                                    }
                                }}
                            >
                                <Box className="card-icon" sx={{ display: 'flex', color: 'text.secondary', transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                                    {card.icon}
                                </Box>
                                <Typography
                                    className="card-text"
                                    sx={{
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'text.secondary',
                                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                                    }}
                                >
                                    {card.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* --- NEW SECTIONS --- */}
            <HowItWorks activeStep={helpStep} handleSearchFocus={handleSearchFocus} />

            {/* Footer */}
            {/* <Footer /> */}

            {/* AI Maintenance Modal */}
            <AiMaintenanceModal
                open={showMaintenanceModal}
                onClose={() => setShowMaintenanceModal(false)}
                onSwitchToDesign={() => setSelectedMode('design')}
            />

            {/* AI Subscription Modal */}
            <AiSubscriptionModal
                open={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />

            {/* AI Training Modal */}
            <AiTrainingModal
                open={showTrainingModal}
                onClose={() => setShowTrainingModal(false)}
            />
        </GridBackground>
    );
}

export default Home;