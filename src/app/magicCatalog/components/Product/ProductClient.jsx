"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import { logErrorToServer } from "@mc/utils/errorLogger";
import {
    Container,
    Box,
    Button,
    Typography,
    Fade,
    Popover,
    Tooltip,
    Chip,
    IconButton,
} from "@mui/material";
import { ShoppingCart, Square, CheckSquare, X as XIcon } from "lucide-react";

import ScrollToTop from "@mc/components/ScrollToTop";
import FullPageLoader from "@mc/components/FullPageLoader";
import FilterSidebar from "@mc/components/Product/FilterSidebar";
import PaginationControls from "@mc/components/PaginationControls";
import { searchService, preloadService } from "@mc/services/apiService";
import { autoScrollToRestoredTarget, base64ToFile, compressImagesToWebP } from "@mc/utils/globalFunc";
import ProductGrid from "./ProductGrid";
import ProductModal from "./ProductModal";
import ProductListView from "./ProductListView";
import ProductSummaryCards from "./ProductSummaryCards";
import SimilarProductsModal from "./SimilarProductsModal";
import ArticleDrawer from "./ArticleDrawer";
import { getMatchedDesignCollections, filterProducts, createSearchChip, searchLocalCatalog, mergeSearchResults } from "./ProductHelpers";
import { useCart } from '@mc/context/CartContext';
import { useToast } from '@mc/context/ToastContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useProductData } from '@mc/context/ProductDataContext';
import { getAlbumByIdApi } from '@mc/app/api/albumApi';
import GridBackground from "@mc/components/Common/GridBackground";
import { isFrontendFeRoute } from "@mc/utils/urlUtils";

import ProductPageHeader from "@mc/components/Product/ProductPageHeader";
import CatalogLanding from "@mc/components/Product/CatalogLanding";
import ReusableConfirmModal from '@mc/components/Common/modals/ReusableConfirmModal';
import { AiMaintenanceModal, AiSubscriptionModal, AiTrainingModal } from '@mc/components/Common/modals';
import { MultiSelectProvider, useMultiSelect } from '@mc/context/MultiSelectContext';
import { saveAiSearchRequestApi } from '@mc/app/api/saveAiSearchRequestApi';
import { useAuth } from '@mc/context/AuthContext';
import { TokenUsageProvider, useTokenUsage } from '@mc/context/TokenUsageContext';
import { getTokenDetailsApi } from '@mc/app/api/getTokenDetailsApi';
import { getTokenMasterApi, getTokenCost } from '@mc/app/api/getTokenMasterApi';


function ProductClientContent({ onInitialLoadComplete, onLoaderPropsChange }) {
    const PRODUCT_LIST_RESTORE_KEY = 'productListRestoreState';
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isInitialLoadPending, setIsInitialLoadPending] = useState(true);
    const [isPendingSearchLoading, setIsPendingSearchLoading] = useState(false);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false); // New state for removal confirm
    const { totalCount, items: cartItems, addToCart, removeFromCart, clearCart } = useCart();
    const { showSuccess, showInfo, showWarning } = useToast();
    const router = useRouter();

    // Multi-select context
    const {
        isMultiSelectMode,
        selectedProductIds,
        selectedCount,
        toggleMultiSelectMode,
        clearSelection,
        selectAll,
        selectBatch,
        deselectBatch,
        isProductSelected
    } = useMultiSelect();

    const didAttemptRestoreRef = useRef(false);
    const skipNextPageResetRef = useRef(false);
    const isRestoringRef = useRef(false);
    const pendingRestoreStateRef = useRef(null);
    const [restoreTargetIndex, setRestoreTargetIndex] = useState(undefined);

    // Use product data context
    const { catalogData, catalogLoading, fetchCatalog, pendingSearch, setPendingSearch } = useProductData();
    const [catalogView, setCatalogView] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('catalogView') || 'design';
        }
        return 'design';
    });
    // Get auth context for config flags
    const { isConfigEnabled } = useAuth();
    // IsProAlbum flag controls multi-catalog browsing; when off the page
    // behaves like before — design catalog only, no view toggle
    const isProAlbum = isConfigEnabled('IsProAlbum');
    const effectiveView = isProAlbum ? catalogView : 'design';
    const activeCatalog = useMemo(() => catalogData?.[effectiveView] || [], [catalogData, effectiveView]);

    // Catalog picker row — re-armed whenever /product becomes the active route.
    // Next.js preserves visited pages' state across client-side navigation,
    // so a plain useState(true) only fires on reload — this effect re-runs
    // when the cached tree is revealed again (pathname change / reconnect).
    const pathname = usePathname();
    const [showCatalogLanding, setShowCatalogLanding] = useState(true);
    useEffect(() => {
        if (pathname === '/magicCatalog/product') setShowCatalogLanding(true);
    }, [pathname]);

    // Selections can span catalog views — resolve against every catalog
    const allCatalogProducts = useMemo(
        () => [
            ...(catalogData?.design || []),
            ...(catalogData?.stock || []),
            ...(catalogData?.article || []),
        ],
        [catalogData]
    );

    // O(1) id → product lookups — built once per catalog load, not per click.
    // Resolving selected items via this map is O(selected) instead of
    // O(all catalog rows), which keeps selection smooth at lakh-scale data.
    const productById = useMemo(() => {
        const map = new Map();
        for (const p of allCatalogProducts) map.set(p.id, p);
        return map;
    }, [allCatalogProducts]);

    const selectedProducts = useMemo(() => {
        const out = [];
        for (const id of selectedProductIds) {
            const p = productById.get(id);
            if (p) out.push(p);
        }
        return out;
    }, [selectedProductIds, productById]);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [urlParamsFlag, setUrlParamsFlag] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [searchMode, setSearchMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('searchMode') || 'design';
        }
        return 'design';
    });
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionVariant, setSubscriptionVariant] = useState('subscription');
    const [showTrainingModal, setShowTrainingModal] = useState(false);

    // View mode state (grid or list)
    const [viewMode, setViewMode] = useState(() => {
        // if (typeof window !== 'undefined') {
        //     return sessionStorage.getItem('productViewMode') || 'grid';
        // }
        return 'grid';
    });

    // Summary cards visibility
    const [showSummary, setShowSummary] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('showProductSummary');
            return saved !== null ? saved === 'true' : true; // Default to true
        }
        return true;
    });

    const { incrementUsage: incrementTokenUsage, setTokenData, refreshTokens, hasEnoughTokens } = useTokenUsage();

    // Fetch token master config on mount
    useEffect(() => {
        getTokenMasterApi();
    }, []);

    // Fire-and-forget preload API call on page load (non-blocking, independent)
    useEffect(() => {
        preloadService();
    }, []);

    // Similar Product Search State
    const [similarProductHistory, setSimilarProductHistory] = useState([]);
    const [similarProductCurrentIndex, setSimilarProductCurrentIndex] = useState(-1);
    const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);

    // Filter Popover State
    const [anchorElFilter, setAnchorElFilter] = useState(null);
    const [filterPopoverItems, setFilterPopoverItems] = useState([]);



    useEffect(() => {
        const flag = sessionStorage.getItem("urlParams");
        setUrlParamsFlag(flag);
    }, []);

    // ?albumid=<id> in the URL → fetch the album once (kept in state,
    // not rendered into the product list — wiring comes later)
    const searchParams = useSearchParams();
    const albumFetchRef = useRef(false);
    const [albumData, setAlbumData] = useState(null);
    useEffect(() => {
        if (albumFetchRef.current) return;
        // ?albumsaved=1 — album was just saved in the host app, reset the cart
        if (searchParams.get('albumsaved') === '1') {
            albumFetchRef.current = true;
            clearCart();
            sessionStorage.removeItem('albumId');
            return;
        }
        const albumId = searchParams.get('albumid') || searchParams.get('albumId') || searchParams.get('AlbumId');
        if (!albumId) return;
        albumFetchRef.current = true;
        // Persist so checkout can send it in the postMessage payload
        sessionStorage.setItem('albumId', albumId);
        (async () => {
            try {
                const res = await getAlbumByIdApi(albumId);
                setAlbumData(res);

                // Album JsonData is a saved selection — auto-add each row to
                // the cart, matching items by source (design/stock/article)
                let selections = [];
                try {
                    selections = JSON.parse(res?.rd?.[0]?.JsonData || '[]');
                } catch {
                    selections = [];
                }
                if (!Array.isArray(selections) || selections.length === 0) return;

                const [designItems, stockItems] = await Promise.all([
                    fetchCatalog('design'),
                    fetchCatalog('stock'),
                ]);
                const byDesignno = (items, designno) =>
                    items.find((p) => String(p?.designno ?? p?.DesignNo ?? '') === String(designno));

                let added = 0;
                const matchedIds = [];
                selections.forEach((row) => {
                    const src = row.source || 'design';
                    let item = src === 'stock'
                        ? stockItems.find((p) => String(p?.StockBarcode || '') === String(row.stockbarcode))
                        : byDesignno(designItems, row.designno);
                    if (!item) return;
                    if (src === 'article') {
                        item = { ...item, source: 'article', id: `article:${item.rawId}` };
                    }
                    const extras = {};
                    if (row.articlemastercode) {
                        extras.selectedArticles = String(row.articlemastercode)
                            .split(',')
                            .filter(Boolean)
                            .map((code) => ({
                                id: `art:${item.rawId}:${code}`,
                                articleno: code,
                                articlemastercode: code,
                                designno: item.designno || '',
                            }));
                    }
                    if (row.allarticles) extras.allArticlesSelected = true;
                    addToCart({ ...item, ...extras });
                    matchedIds.push(item.id);
                    added += 1;
                });
                if (matchedIds.length) {
                    // Mark the album's products selected in the grid too
                    selectBatch(matchedIds);
                }
                if (added > 0) {
                    showSuccess(`${added} item${added === 1 ? '' : 's'} added to cart from album`);
                }
            } catch (err) {
                console.error('Failed to load album:', err);
            }
        })();
    }, [searchParams, clearCart]);

    // Right-click on the catalog toggle → force-refetch that catalog
    // (bypasses IndexedDB/memory cache — hits the API fresh)
    const handleReloadCatalog = useCallback(async (view) => {
        try {
            await fetchCatalog(view, true);
        } catch (err) {
            console.error(`Failed to reload ${view} catalog:`, err);
        }
    }, [fetchCatalog]);

    const handleFilterPopoverOpen = (event, items) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const paperWidth = Math.min(320, window.innerWidth - 24);
        setAnchorElFilter({
            top: rect.bottom + 8,
            left: Math.max(12, window.innerWidth - paperWidth - 12),
        });
        setFilterPopoverItems(items);
    };

    const handleFilterPopoverClose = () => {
        setAnchorElFilter(null);
        setFilterPopoverItems([]);
    };

    const handleSearchSimilar = useCallback((product) => {
        setSimilarProductHistory(prev => {
            const newHistory = prev.slice(0, similarProductCurrentIndex + 1);
            return [...newHistory, product];
        });
        setSimilarProductCurrentIndex(prev => prev + 1);
        setIsSimilarModalOpen(true);
    }, [similarProductCurrentIndex]);

    const handleSimilarModalClose = useCallback(() => {
        setIsSimilarModalOpen(false);
        setSimilarProductHistory([]);
        setSimilarProductCurrentIndex(-1);
    }, []);

    const handleSimilarBack = useCallback(() => {
        setSimilarProductCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);

    const handleSimilarForward = useCallback(() => {
        setSimilarProductCurrentIndex(prev => Math.min(similarProductHistory.length - 1, prev + 1));
    }, [similarProductHistory.length]);

    const currentSimilarProduct = similarProductHistory[similarProductCurrentIndex] || null;

    // Article drawer state
    const [articleDrawerProduct, setArticleDrawerProduct] = useState(null);
    // Product details opened from the drawer's info icon
    const [detailProduct, setDetailProduct] = useState(null);
    const handleShowArticles = useCallback((product) => {
        // Preload article picks if this design is already in the cart
        const inCart = cartItems.find(i => i.id === product?.id);
        setArticleDrawerProduct(
            inCart
                ? {
                    ...product,
                    selectedArticles: inCart.selectedArticles,
                    allArticlesSelected: inCart.allArticlesSelected,
                }
                : product
        );
    }, [cartItems]);
    const handleArticleConfirm = useCallback((selectedIds, product) => {
        if (!product || !selectedIds?.length) {
            setArticleDrawerProduct(null);
            return;
        }
        addToCart({ ...product, selectedArticles: selectedIds });
        showSuccess(`${product?.designno || 'Design'} + ${selectedIds.length} article${selectedIds.length === 1 ? '' : 's'} added to cart`);
        setArticleDrawerProduct(null);
    }, [addToCart, showSuccess]);

    const pendingSearchExecutedRef = useRef(false);
    const isPendingSearchLoadingRef = useRef(false);
    const isInitialLoadPendingRef = useRef(true);

    // Debounce search term for better performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm]);


    const [searchResults, setSearchResults] = useState(null);
    const [lastSearchData, setLastSearchData] = useState(null);

    // Items per page with sessionStorage persistence (guarded for SSR)
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('productsPerPage');
            return saved ? parseInt(saved, 10) : 200;
        }
        return 200;
    });

    // Save itemsPerPage to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('productsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    const handleItemsPerPageChange = useCallback((newValue) => {
        setItemsPerPage(newValue);
        setCurrentPage(1);
    }, []);

    const baseDataset = useMemo(() => {
        return searchResults !== null ? searchResults : activeCatalog;
    }, [searchResults, activeCatalog]);

    const finalFilteredProducts = useMemo(() => {
        return filterProducts(baseDataset, appliedFilters, debouncedSearchTerm);
    }, [baseDataset, appliedFilters, debouncedSearchTerm]);

    // Calculate total pages
    const totalPages = useMemo(() => {
        return Math.ceil(finalFilteredProducts.length / itemsPerPage);
    }, [finalFilteredProducts.length, itemsPerPage]);

    // Get current page products (optimized for large datasets)
    const displayedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return finalFilteredProducts.slice(startIndex, endIndex);
    }, [finalFilteredProducts, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (isRestoringRef.current) {
            return;
        }
        if (skipNextPageResetRef.current) {
            skipNextPageResetRef.current = false;
            return;
        }
        setCurrentPage(1);
    }, [finalFilteredProducts]);

    useEffect(() => {
        if (didAttemptRestoreRef.current) return;
        if (typeof window === 'undefined') return;

        const raw = sessionStorage.getItem(PRODUCT_LIST_RESTORE_KEY);
        if (!raw) {
            didAttemptRestoreRef.current = true;
            return;
        }

        let state = null;
        try {
            state = JSON.parse(raw);
        } catch (e) {
            sessionStorage.removeItem(PRODUCT_LIST_RESTORE_KEY);
            didAttemptRestoreRef.current = true;
            return;
        }

        didAttemptRestoreRef.current = true;
        isRestoringRef.current = true;
        pendingRestoreStateRef.current = state;

        if (typeof state?.searchTerm === 'string') {
            setSearchTerm(state.searchTerm);
        }
        if (Array.isArray(state?.appliedFilters)) {
            setAppliedFilters(state.appliedFilters);
        }
        if (state && Object.prototype.hasOwnProperty.call(state, 'searchResults')) {
            setSearchResults(state.searchResults);
        }
        if (state?.searchMode) {
            setSearchMode(state.searchMode);
        }
        if (state?.catalogView) {
            setCatalogView(state.catalogView);
        }
    }, []);

    useEffect(() => {
        if (searchMode) {
            sessionStorage.setItem('searchMode', searchMode);
        }
    }, [searchMode]);

    useEffect(() => {
        if (catalogView) {
            sessionStorage.setItem('catalogView', catalogView);
        }
    }, [catalogView]);

    // Lazy-fetch the catalog when switching views; reset search/page state
    const handleCatalogViewChange = useCallback((view) => {
        if (!view) return;
        setShowCatalogLanding(false);
        if (!isProAlbum) return;
        if (view === catalogView) return;
        setCatalogView(view);
        setSearchResults(null);
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setCurrentPage(1);
        setError(null);
        setAppliedFilters(prev =>
            prev.filter(
                (f) => !(f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id))
            )
        );
        fetchCatalog(view).catch(() => {});
    }, [catalogView, fetchCatalog, isProAlbum]);

    useEffect(() => {
        if (viewMode) {
            sessionStorage.setItem('productViewMode', viewMode);
        }
    }, [viewMode]);

    useEffect(() => {
        sessionStorage.setItem('showProductSummary', showSummary.toString());
    }, [showSummary]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!pendingRestoreStateRef.current) return;
        if (!Number.isFinite(totalPages) || totalPages < 1) return;

        const state = pendingRestoreStateRef.current;
        pendingRestoreStateRef.current = null;
        sessionStorage.removeItem(PRODUCT_LIST_RESTORE_KEY);

        const nextPageRaw = Number(state?.currentPage);
        const nextPage = Number.isFinite(nextPageRaw)
            ? Math.min(Math.max(nextPageRaw, 1), totalPages || 1)
            : 1;

        const targetIndexRaw = Number(state?.targetIndex);
        const targetIndex = Number.isFinite(targetIndexRaw) && targetIndexRaw >= 0
            ? targetIndexRaw
            : undefined;

        setRestoreTargetIndex(targetIndex);
        skipNextPageResetRef.current = true;
        setCurrentPage(nextPage);

        const targetId = state?.productId != null ? String(state.productId) : null;
        const scrollYRaw = Number(state?.scrollY);
        const scrollY = Number.isFinite(scrollYRaw) && scrollYRaw >= 0 ? scrollYRaw : null;

        autoScrollToRestoredTarget({
            targetId,
            scrollY,
            dataAttr: 'data-product-id',
        });

        requestAnimationFrame(() => {
            isRestoringRef.current = false;
        });
    }, [totalPages]);

    const handleOpenCart = useCallback(() => {
        if (typeof window === 'undefined') {
            router.push('/magicCatalog/cart');
            return;
        }

        let productId = null;
        let targetIndex = null;

        try {
            const nodes = Array.from(document.querySelectorAll('[data-product-id][data-product-index]'));
            let bestNode = null;
            let bestTop = Number.POSITIVE_INFINITY;
            for (const node of nodes) {
                const rect = node.getBoundingClientRect();
                const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
                if (!isVisible) continue;
                if (rect.top < bestTop) {
                    bestTop = rect.top;
                    bestNode = node;
                }
            }

            if (bestNode) {
                productId = bestNode.getAttribute('data-product-id');
                const idx = Number(bestNode.getAttribute('data-product-index'));
                targetIndex = Number.isFinite(idx) ? idx : null;
            }
        } catch (e) {
        }

        const payload = {
            currentPage,
            productId,
            targetIndex,
            scrollY: window.scrollY,
            appliedFilters,
            searchTerm,
            searchResults,
            searchMode,
            catalogView,
            timestamp: Date.now(),
        };

        try {
            sessionStorage.setItem(PRODUCT_LIST_RESTORE_KEY, JSON.stringify(payload));
        } catch (e) {
        }

        router.push('/magicCatalog/cart');
    }, [router, currentPage, appliedFilters, searchTerm, searchResults, catalogView]);

    // Multi-select handlers
    const handleBulkAddToCart = useCallback(() => {
        if (selectedProducts.length === 0) {
            return;
        }

        let addedCount = 0;
        selectedProducts.forEach(product => {
            // Check if already in cart to avoid double-counting/quantity increment in bulk
            const alreadyInCart = cartItems.some(item => item.id === product.id);
            if (!alreadyInCart) {
                addToCart(product);
                addedCount++;
            }
        });

        // Exit multi-select mode and clear selections
        toggleMultiSelectMode();

        // Show success feedback
        if (addedCount > 0) {
            showSuccess(`${addedCount} ${addedCount === 1 ? 'item' : 'items'} added to cart`);
        } else {
            showInfo('All selected items are already in your cart');
        }
    }, [selectedProducts, addToCart, toggleMultiSelectMode, cartItems, showSuccess, showInfo]);

    const isRemovalMode = useMemo(() => {
        if (selectedProducts.length === 0) return false;
        // If ALL selected products are already in cart, show "Remove from Cart"
        return selectedProducts.every(product =>
            cartItems.some(item => item.id === product.id)
        );
    }, [selectedProducts, cartItems]);

    const newItemsCount = useMemo(() => {
        return selectedProducts.filter(product =>
            !cartItems.some(item => item.id === product.id)
        ).length;
    }, [selectedProducts, cartItems]);

    const handleBulkRemoveFromCart = useCallback(() => {
        setIsRemoveConfirmOpen(true);
    }, []);

    const executeBulkRemove = useCallback(() => {
        const removedCount = selectedProducts.length;
        selectedProducts.forEach(product => {
            removeFromCart(product.id);
        });
        setIsRemoveConfirmOpen(false);
        toggleMultiSelectMode();
        showSuccess(`${removedCount} ${removedCount === 1 ? 'item' : 'items'} removed from cart`);
    }, [selectedProducts, removeFromCart, toggleMultiSelectMode, showSuccess]);

    const isAllSelected = useMemo(() => {
        if (!displayedProducts.length) return false;
        return displayedProducts.every(p => isProductSelected(p.id));
    }, [displayedProducts, isProductSelected]);

    const handleSelectAllToggle = useCallback(() => {
        const ids = displayedProducts.map(p => p.id);
        if (isAllSelected) {
            deselectBatch(ids);
            showInfo('All items deselected');
        } else {
            selectBatch(ids);
            showSuccess(`${ids.length} items selected`);
        }
    }, [isAllSelected, displayedProducts, selectBatch, deselectBatch, showSuccess, showInfo]);

    const handleCancelMultiSelect = useCallback(() => {
        toggleMultiSelectMode();
    }, [toggleMultiSelectMode]);

    const handleApplyFilters = useCallback((applied) => {
        setIsFilterLoading(true);
        const searchFilters = appliedFilters.filter(
            (f) => f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id)
        );

        const drawerFilters = applied.filter(
            (f) => !(f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id))
        );

        const allAppliedFilters = [...searchFilters, ...drawerFilters];

        // Artificial delay to show loading state
        setTimeout(() => {
            setAppliedFilters(allAppliedFilters);
            setIsFilterLoading(false);
        }, 800);
    }, [appliedFilters]);

    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
    }, []);

    const removeFilter = useCallback(
        ({ item }) => {
            const newApplied = appliedFilters.filter((f) => f.item.id !== item.id);
            if (item && ["text-search", "image-search", "hybrid-search"].includes(item.id)) {
                setSearchResults(null);
                setSearchTerm('');
                setDebouncedSearchTerm('');
                setError(null);
            }
            setAppliedFilters(newApplied);
        },
        [appliedFilters]
    );

    const clearAllFilters = useCallback(() => {
        setAppliedFilters([]);
        setSearchResults(null);
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setError(null);
    }, []);

    const handleSuggestionClick = useCallback((suggestion) => {
        if (!suggestion || !suggestion.value) return;
        const newFilter = {
            category: suggestion.filterCategory || 'Search',
            item: {
                id: suggestion.id || suggestion.value,
                name: suggestion.name || suggestion.label || suggestion.value,
                value: suggestion.value
            }
        };
        setAppliedFilters(prev => {
            const exists = prev.some(f =>
                f.category === newFilter.category &&
                f.item.value === newFilter.item.value
            );
            if (exists) return prev;
            return [...prev, newFilter];
        });
    }, []);

    const handlePageChange = useCallback((page) => {
        setIsTransitioning(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            setCurrentPage(page);
            setIsTransitioning(false);
        }, 100);
    }, []);



    const handleSubmit = useCallback(async (searchData, catalogOverride) => {
        setShowCatalogLanding(false);
        const requestedMode = searchData?.mode || searchMode;
        const modeToUse = requestedMode === 'design' && searchData?.image ? 'ai' : requestedMode;
        // Pending searches always target the design catalog
        const catalogForMatching = catalogOverride || activeCatalog;

        const finishPendingSearch = () => {
            setIsSearchLoading(false);
            if (isPendingSearchLoadingRef.current) {
                isPendingSearchLoadingRef.current = false;
                setIsPendingSearchLoading(false);
                if (!isInitialLoadPendingRef.current) onInitialLoadComplete?.();
            }
        };

        setIsSearchLoading(true);

        // Check config flags if AI mode is selected
        if (modeToUse === 'ai') {
            // Check IsAiMaintenance first
            if (isConfigEnabled('IsAiMaintenance')) {
                finishPendingSearch();
                setShowMaintenanceModal(true);
                return;
            }
            // Check IsAiEnable (when enabled, show subscription modal)
            if (isConfigEnabled('IsAiEnable')) {
                finishPendingSearch();
                setSubscriptionVariant('subscription');
                setShowSubscriptionModal(true);
                return;
            }
            // Check IsAiReady (when enabled, show training modal)
            if (isConfigEnabled('IsAiReady')) {
                finishPendingSearch();
                setShowTrainingModal(true);
                return;
            }
            // Determine search type for token cost check
            let effectiveSearchFlag = searchData?.isSearchFlag ?? 0;
            if (effectiveSearchFlag === 0) {
                if (searchData?.image && searchData?.text) effectiveSearchFlag = 3;
                else if (searchData?.image) effectiveSearchFlag = 2;
                else if (searchData?.text) effectiveSearchFlag = 1;
            }
            const eventNames = { 1: 'TextSearch', 2: 'ImageSearch', 3: 'HybridSearch' };
            const eventName = eventNames[effectiveSearchFlag] || 'TextSearch';

            // Check token availability before AI search (fresh API call)
            const tokenData = await getTokenDetailsApi();
            if (!tokenData) {
                finishPendingSearch();
                setSubscriptionVariant('upgrade');
                setShowSubscriptionModal(true);
                return;
            }
            // Sync local state with fresh API data
            setTokenData(tokenData);
            const freshRemaining = Math.max(0, (tokenData.totalToken ?? 0) - (tokenData.tokenUsed ?? 0));
            const searchCost = getTokenCost(eventName);
            if (freshRemaining < searchCost) {
                finishPendingSearch();
                setSubscriptionVariant('upgrade');
                setShowSubscriptionModal(true);
                return;
            }
        }

        // Resiliency check: if isSearchFlag is 0 or missing but we have content, infer it
        let effectiveSearchFlag = searchData?.isSearchFlag ?? 0;
        if (effectiveSearchFlag === 0 && modeToUse === 'ai') {
            if (searchData?.image && searchData?.text) effectiveSearchFlag = 3;
            else if (searchData?.image) effectiveSearchFlag = 2;
            else if (searchData?.text) effectiveSearchFlag = 1;
        }

        if ((!effectiveSearchFlag || effectiveSearchFlag === 0) && modeToUse === 'ai') {
            setLastSearchData({ ...searchData, mode: modeToUse });
            setError(null);
            incrementTokenUsage(getTokenCost('TextSearch'));

            setTimeout(() => {
                startTransition(() => {
                    setSearchResults(null);
                    setSearchTerm(searchData?.text || '');
                    setDebouncedSearchTerm(searchData?.text || '');
                    finishPendingSearch();
                });
            }, 300);
            return;
        }

        // In design mode, we don't call the search API, just navigate/filter
        // UNLESS an image is provided, then we force AI search
        if (modeToUse === 'design' && !searchData?.image) {
            setLastSearchData({ ...searchData, mode: modeToUse });
            setError(null);
            incrementTokenUsage(getTokenCost('TextSearch'));

            // Synthetic delay to show the search loader and prevent flicker.
            // The heavy re-render (filter over the full catalog + grid mount)
            // runs as a transition so it can yield instead of blocking a frame.
            setTimeout(() => {
                startTransition(() => {
                    setSearchResults(null);
                    setSearchTerm(searchData.text || '');
                    setDebouncedSearchTerm(searchData.text || '');
                    setAppliedFilters(prev =>
                        prev.filter(
                            (f) => !(f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id))
                        )
                    );
                    finishPendingSearch();
                });
            }, 600);
            return;
        }

        setLastSearchData({ ...searchData, mode: modeToUse });
        setError(null);
        const eventNames = { 1: 'TextSearch', 2: 'ImageSearch', 3: 'HybridSearch' };
        incrementTokenUsage(getTokenCost(eventNames[effectiveSearchFlag] || 'TextSearch'));
        let finalImage = searchData.image;
        try {
            const options = {
                top_k: searchData?.numResults || "10",
                aiApi: sessionStorage.getItem('aiApi') || "",
                min_percent: searchData?.accuracy || "50.0",
            };

            // Skip compression if already handled (e.g., from Home page)
            if (finalImage && !searchData.isPreProcessed && (searchData.isSearchFlag === 2 || searchData.isSearchFlag === 3)) {
                try {
                    const compressedResults = await compressImagesToWebP(finalImage);
                    if (compressedResults.length > 0) {
                        finalImage = compressedResults[0].blob;
                    }
                } catch (compressErr) {
                    logErrorToServer({
                        shortReason: "Image compression failed on Product page",
                        detailedReason: compressErr
                    });
                }
            }

            const res = await (async () => {
                if (effectiveSearchFlag === 1) {
                    return searchService.searchByText(searchData.text?.trim(), options);
                }
                if (effectiveSearchFlag === 2) {
                    return searchService.searchByImage(finalImage, options);
                }
                if (effectiveSearchFlag === 3) {
                    return searchService.searchHybrid(
                        { file: finalImage, query: searchData.text?.trim() },
                        options
                    );
                }
            })();

            if (!res || !Array.isArray(res)) {
                // Background logging for Failure (Unexpected Response)
                const eventNames = { 1: "TextSearch", 2: "ImageSearch", 3: "HybridSearch" };
                saveAiSearchRequestApi({
                    EventName: eventNames[effectiveSearchFlag] || "AiSearch",
                    SearchText: searchData.text || "",
                    ImageFile: finalImage,
                    IsSuccess: "0"
                }).catch(logErr => console.error("Logging failed:", logErr));

                const localFallback = (effectiveSearchFlag === 1 || effectiveSearchFlag === 3) && searchData.text?.trim()
                    ? searchLocalCatalog(searchData.text, catalogForMatching)
                    : [];
                setSearchResults(localFallback);
                const fallbackChip = localFallback.length ? createSearchChip(searchData) : null;
                setAppliedFilters((prev) =>
                    [
                        ...(fallbackChip ? [fallbackChip] : []),
                        ...prev.filter(
                            (f) => !(f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id))
                        ),
                    ]
                );
                return;
            }

            const sortedMatchedDesigns = getMatchedDesignCollections(res, catalogForMatching);

            // Hybrid merge: local catalog matches (metadata the AI index lacks)
            // rank first, AI visual matches follow — deduped inside mergeSearchResults
            const localMatches = (effectiveSearchFlag === 1 || effectiveSearchFlag === 3) && searchData.text?.trim()
                ? searchLocalCatalog(searchData.text, catalogForMatching)
                : [];
            const mergedResults = localMatches.length
                ? mergeSearchResults(localMatches, sortedMatchedDesigns)
                : sortedMatchedDesigns;

            // Store search results - drawer filters will be applied on top
            setSearchResults(mergedResults);

            const searchChip = createSearchChip(searchData);

            if (searchChip) {
                setAppliedFilters((prev) => [
                    searchChip,
                    ...prev.filter(
                        (f) => !(f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id))
                    ),
                ]);
            }

            // Background logging for Success
            const eventNames = { 1: "TextSearch", 2: "ImageSearch", 3: "HybridSearch" };
            saveAiSearchRequestApi({
                EventName: eventNames[effectiveSearchFlag] || "AiSearch",
                SearchText: searchData.text || "",
                ImageFile: finalImage,
                IsSuccess: "1"
            }).catch(logErr => console.error("Logging failed:", logErr));

        } catch (err) {
            console.error("Search Error:", err);
            logErrorToServer({
                shortReason: "Search execution failed on Product page",
                detailedReason: {
                    message: err.message,
                    stack: err.stack,
                    searchData
                }
            });

            if (err.isTrainingPending) {
                setShowTrainingModal(true);
                setSearchResults([]);
                return;
            }

            const userErrorMsg = err.isNetworkError
                ? "Network error. Please check your connection and try again."
                : err.status === 500
                    ? "Server error. Please try again later."
                    : err.status === 429
                        ? "Too many requests. Please wait a moment and try again."
                        : err.message || "Search failed. Please try again.";

            setError(userErrorMsg);
            showWarning(userErrorMsg);
            setSearchResults([]);

            // Create error chip to show failed search
            const errorChip = createSearchChip(searchData, true);

            if (errorChip) {
                setAppliedFilters((prev) => [
                    errorChip,
                    ...prev.filter(
                        (f) => !(f && f.item && ["text-search", "image-search", "hybrid-search"].includes(f.item.id))
                    ),
                ]);
            }

            // Background logging for Failure
            const eventNames = { 1: "TextSearch", 2: "ImageSearch", 3: "HybridSearch" };
            saveAiSearchRequestApi({
                EventName: eventNames[effectiveSearchFlag] || "AiSearch",
                SearchText: searchData.text || "",
                ImageFile: finalImage,
                IsSuccess: "0"
            }).catch(logErr => console.error("Logging failed:", logErr));

        } finally {
            setIsSearchLoading(false);
            // If this was a pending search from home, notify the route that everything is done
            if (isPendingSearchLoadingRef.current) {
                isPendingSearchLoadingRef.current = false;
                setIsPendingSearchLoading(false);
                if (!isInitialLoadPendingRef.current) {
                    onInitialLoadComplete?.();
                }
            }
            refreshTokens();
        }
    }, [activeCatalog, searchMode, isConfigEnabled, refreshTokens, setTokenData, onInitialLoadComplete]);

    // Pending search effect — moved after handleSubmit to avoid TDZ (Cannot access 'handleSubmit' before initialization)
    useEffect(() => {
        // 1. Priority: Context-based pending search (instant from Home)
        if (pendingSearch && !pendingSearchExecutedRef.current) {
            // Home searches target the design catalog — wait until it's loaded
            if (catalogData.design.length === 0) {
                fetchCatalog('design').catch(() => {});
                return;
            }
            pendingSearchExecutedRef.current = true;
            const data = { ...pendingSearch };
            setPendingSearch(null); // Clear it so it doesn't re-run

            if (catalogView !== 'design') setCatalogView('design');
            if (data.mode) setSearchMode(data.mode);
            if (Array.isArray(data.filters)) setAppliedFilters(data.filters);

            // Mark that a pending search is in progress so the route loader stays visible
            isPendingSearchLoadingRef.current = true;
            setIsPendingSearchLoading(true);

            // Update route-level loader to show search-appropriate content
            const modeToUse = (data.mode === 'design' && data.image) ? 'ai' : (data.mode || 'ai');
            if (modeToUse === 'ai') {
                const searchFlag = data.isSearchFlag || (data.image && data.text ? 3 : data.image ? 2 : data.text ? 1 : 1);
                onLoaderPropsChange?.({
                    rotatingType: { 1: 'text', 2: 'image', 3: 'hybrid' }[searchFlag] || 'text',
                    subtitle: undefined,
                });
            } else {
                onLoaderPropsChange?.({
                    rotatingType: undefined,
                    subtitle: data.text?.trim() ? `Finding matches for "${data.text.trim()}"` : "Analyzing your design and matching collections",
                });
            }

            // Start submission immediately
            handleSubmit(data, catalogData.design);
            return;
        }

        // 2. Fallback: Session storage (for refreshes or older flows)
        const encoded = sessionStorage.getItem("homeSearchData");
        if (encoded && catalogData.design.length > 0) {
            try {
                const jsonString = decodeURIComponent(escape(atob(encoded)));
                const searchData = JSON.parse(jsonString);
                const now = Date.now();
                const dataAge = now - (searchData.timestamp || 0);
                const fiveMinutes = 5 * 60 * 1000;

                if (dataAge < fiveMinutes) {
                    if (searchData.image && typeof searchData.image === "string" && searchData.image.startsWith("data:")) {
                        searchData.image = base64ToFile(searchData.image, "uploaded-image.png");
                    }
                    if (searchData.mode) {
                        setSearchMode(searchData.mode);
                    }
                    if (catalogView !== 'design') setCatalogView('design');
                    handleSubmit({ ...searchData, mode: searchData.mode || 'ai' }, catalogData.design);
                    if (Array.isArray(searchData.filters) && searchData.filters.length > 0) {
                        setAppliedFilters(searchData.filters);
                    }
                    sessionStorage.removeItem('homeSearchData');
                }

            } catch (error) {
                console.error('Error processing stored search data:', error);
                sessionStorage.removeItem('homeSearchData');
            }
        }
    }, [catalogData.design, catalogView, pendingSearch, setPendingSearch, onLoaderPropsChange, handleSubmit, fetchCatalog]);

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                await fetchCatalog(effectiveView);
            } catch (err) {
                console.error(err);
                if (mounted) setError("Failed to load products");
            } finally {
                if (mounted) {
                    setIsInitialLoadPending(false);
                    isInitialLoadPendingRef.current = false;
                    // Only notify route if no pending search is in progress
                    if (!isPendingSearchLoadingRef.current) {
                        onInitialLoadComplete?.();
                    }
                }
                // Idle prefetch of the other catalogs so view switching is instant
                if (isProAlbum) {
                    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
                    idle(() => {
                        ["design", "stock", "article"]
                            .filter((v) => v !== catalogView)
                            .forEach((v) => fetchCatalog(v).catch(() => {}));
                    });
                }
            }
        };
        loadData();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchCatalog, onInitialLoadComplete]);

    const loading = catalogLoading[effectiveView];
    // Initial-load fade only for first mount — view switches show grid
    // skeleton instead so the header/chips never collapse or jump
    const showInitialLoader = isInitialLoadPending;

    // Picker row flag — hidden whenever a search is active or being restored
    const showCatalogPicker = isProAlbum
        && showCatalogLanding
        && !pendingSearch
        && !isPendingSearchLoading
        && !searchTerm
        && searchResults === null
        && appliedFilters.length === 0;

    const getBottomPadding = () => {
        if (finalFilteredProducts.length > 7) {
            return { xs: 28, sm: 36, md: 50 };
        }
        return 5;
    };

    return (
        <GridBackground>
            <Container maxWidth={false} sx={{ px: 0, pb: getBottomPadding(), position: "relative", zIndex: 2,
                  transition: 'padding-left 0.4s cubic-bezier(0.86, 0, 0.07, 1), opacity 0.4s ease', 
                 opacity: showInitialLoader ? 0 : 1, pointerEvents: showInitialLoader ? 'none' : 'auto' }} disableGutters>
                <ProductPageHeader
                    isMultiSelectMode={isMultiSelectMode}
                    selectedCount={selectedCount}
                    isAllSelected={isAllSelected}
                    onCancelMultiSelect={handleCancelMultiSelect}
                    onSelectAllToggle={handleSelectAllToggle}
                    onDeselectAll={clearSelection}
                    onBulkAddToCart={handleBulkAddToCart}
                    onBulkRemoveFromCart={handleBulkRemoveFromCart}
                    isRemovalMode={isRemovalMode}
                    newItemsCount={newItemsCount}
                    onToggleMultiSelectMode={() => toggleMultiSelectMode(cartItems.map(item => item.id))}
                    onHomeClick={() => router.push('/magicCatalog')}
                    onOpenCart={handleOpenCart}
                    totalCartItems={totalCount}
                    productCount={finalFilteredProducts.length}
                    appliedFilters={appliedFilters}
                    searchTerm={searchTerm}
                    onRemoveFilter={removeFilter}
                    onClearSearchTerm={() => {
                        setSearchTerm('');
                        setDebouncedSearchTerm('');
                    }}
                    onClearAllFilters={clearAllFilters}
                    onFilterPopoverOpen={handleFilterPopoverOpen}
                    isFilterOpen={isFilterOpen}
                    searchMode={searchMode}
                    catalogView={catalogView}
                    onCatalogViewChange={handleCatalogViewChange}
                    showCatalogToggle={isProAlbum}
                    onReloadCatalog={handleReloadCatalog}
                    onFilterClick={() => setIsFilterOpen(prev => !prev)}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showSummary={showSummary}
                    onToggleSummary={() => setShowSummary(prev => !prev)}
                    onTokenUpgrade={() => {
                        setSubscriptionVariant('upgrade');
                        setShowSubscriptionModal(true);
                    }}
                />

                {error ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '50vh',
                            textAlign: 'center',
                            px: 2,
                        }}
                    >
                        <Typography variant="h5" color="error" gutterBottom>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => lastSearchData && handleSubmit(lastSearchData)}
                            disabled={!lastSearchData}
                            sx={{ mt: 2 }}
                        >
                            Retry Search
                        </Button>
                    </Box>
                ) : (
                    <Fade in={!isTransitioning} timeout={200}>
                        <Box sx={{ p: '16px !important' }}>
                            {/* Catalog picker — first row, products stay visible below */}
                            {showCatalogPicker && (
                                <CatalogLanding
                                    counts={{
                                        design: catalogData?.design?.length || 0,
                                        stock: catalogData?.stock?.length || 0,
                                        article: catalogData?.article?.length || 0,
                                    }}
                                    loading={catalogLoading}
                                    onSelect={handleCatalogViewChange}
                                    isProAlbum={isProAlbum}
                                />
                            )}

                            {/* Summary Cards */}
                            {showSummary && viewMode === 'list' && (
                                <ProductSummaryCards
                                    products={finalFilteredProducts}
                                />
                            )}

                            {viewMode === 'grid' ? (
                                <ProductGrid
                                    designData={displayedProducts}
                                    appliedFilters={appliedFilters}
                                    clearAllFilters={clearAllFilters}
                                    onSearchSimilar={handleSearchSimilar}
                                    onShowArticles={handleShowArticles}
                                    loading={isFilterLoading || loading}
                                    isFilterOpen={isFilterOpen}
                                    restoreTargetIndex={restoreTargetIndex}
                                    searchTerm={searchTerm}
                                    searchMode={searchMode}
                                    catalogView={catalogView}
                                />
                            ) : (
                                <ProductListView
                                    designData={displayedProducts}
                                    onSearchSimilar={handleSearchSimilar}
                                    loading={isFilterLoading || loading}
                                    restoreTargetIndex={restoreTargetIndex}
                                />
                            )}
                        </Box>
                    </Fade>
                )}

                {/* Bottom Pagination */}
                {!error && totalPages > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12, mb: 2 }}>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </Box>
                )}
            </Container >

            {/* Bottom action bar — Select + Cart; in select mode shows Select All / Add / Cancel */}
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
                    {isMultiSelectMode ? (
                        <>
                            <Button
                                onClick={handleSelectAllToggle}
                                startIcon={isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '24px',
                                    color: isAllSelected ? 'primary.main' : 'text.primary',
                                    px: { xs: 1.25, sm: 2 },
                                    py: 0.75,
                                    fontSize: '0.85rem',
                                    '&:hover': { bgcolor: isAllSelected ? 'rgba(115, 103, 240, 0.12)' : 'rgba(0, 0, 0, 0.05)' },
                                }}
                            >
                                {isAllSelected ? "All" : "Select All"}
                            </Button>
                            <Button
                                variant="contained"
                                color={isRemovalMode ? "error" : "primary"}
                                startIcon={isRemovalMode ? <XIcon size={16} /> : <ShoppingCart size={16} />}
                                onClick={isRemovalMode ? handleBulkRemoveFromCart : handleBulkAddToCart}
                                disabled={selectedCount === 0 || (!isRemovalMode && newItemsCount === 0)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '24px',
                                    fontWeight: 600,
                                    px: { xs: 1.25, sm: 2 },
                                    py: 0.75,
                                    fontSize: '0.85rem',
                                    boxShadow: 'none',
                                    '&:hover': { boxShadow: 'none' },
                                }}
                            >
                                {isRemovalMode ? 'Remove' : 'Add'} ({selectedCount})
                            </Button>
                            <Button
                                onClick={handleCancelMultiSelect}
                                color="error"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '24px',
                                    px: { xs: 1.25, sm: 2 },
                                    py: 0.75,
                                    fontSize: '0.85rem',
                                    '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' },
                                }}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={() => toggleMultiSelectMode(cartItems.map(item => item.id))}
                                startIcon={<Square size={16} />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    borderRadius: '24px',
                                    px: 2,
                                    py: 0.75,
                                    fontSize: '0.85rem',
                                    '&:hover': { bgcolor: 'rgba(115, 103, 240, 0.12)' },
                                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                            >
                                Select
                            </Button>
                            <IconButton
                                onClick={handleOpenCart}
                                aria-label="Open cart"
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                                    boxShadow: '0 4px 12px rgba(115, 103, 240, 0.35)',
                                    position: 'relative',
                                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)',
                                        transform: 'translateY(-2px)',
                                    },
                                    '&:active': { transform: 'scale(0.92)' },
                                }}
                            >
                                <ShoppingCart size={20} />
                                {totalCount > 0 && (
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
                                        {totalCount > 99 ? '99+' : totalCount}
                                    </Box>
                                )}
                            </IconButton>
                        </>
                    )}
                </Box>
            </Box>
            <ScrollToTop bottom={isFrontendFeRoute() ? { xs: 190, md: 70 } : { xs: 84, md: 84 }} />

            <FilterSidebar
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                appliedFilters={appliedFilters}
                onSearch={handleSearch}
                currentSearchTerm={searchTerm}
                urlParamsFlag={urlParamsFlag}
                productData={activeCatalog}
            />



            {/* Filter Details Popover — drops below the header's bottom line, right-aligned */}
            <Popover
                open={Boolean(anchorElFilter)}
                anchorReference="anchorPosition"
                anchorPosition={anchorElFilter || undefined}
                onClose={handleFilterPopoverClose}
                PaperProps={{
                    sx: {
                        p: 1.5,
                        width: { xs: 'min(320px, calc(100vw - 24px))', sm: 320 },
                        borderRadius: 2,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Active Filters
                </Typography>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 1,
                    maxHeight: 200,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#e0e0e0',
                        borderRadius: '3px',
                    }
                }}>
                    {filterPopoverItems.map(({ category, item }) => {
                        const isLong = item.name.length > 15;
                        const label = isLong ? `${item.name.substring(0, 12)}...` : item.name;

                        return (
                            <Tooltip title={item.name} key={`${category}-${item.id}-${item.name}`} placement="top" disableHoverListener={!isLong}>
                                <Chip
                                    label={label}
                                    size="small"
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                                        color: 'text.primary',
                                        border: '1px solid rgba(0, 0, 0, 0.10)',
                                        maxWidth: '100%',
                                        "&.MuiButtonBase-root": {
                                            display: 'flex !important',
                                            justifyContent: 'space-between !important'
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.06)',
                                        },
                                        '& .MuiChip-deleteIcon': {
                                            color: 'text.secondary',
                                            opacity: 0.8,
                                            '&:hover': { opacity: 1 }
                                        }
                                    }}
                                    onDelete={() => {
                                        if (item.id === 'drawer-search') setSearchTerm('');
                                        else removeFilter({ item });
                                        if (filterPopoverItems.length <= 2) {
                                            handleFilterPopoverClose();
                                        } else {
                                            setFilterPopoverItems(prev => prev.filter(i => !(i.item.id === item.id && i.item.name === item.name)));
                                        }
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Box>
            </Popover>

            {/* Similar Products Modal */}
            <SimilarProductsModal
                open={isSimilarModalOpen}
                onClose={handleSimilarModalClose}
                baseProduct={currentSimilarProduct}
                allProducts={activeCatalog}
                onSearchSimilar={handleSearchSimilar}
                onBack={handleSimilarBack}
                onForward={handleSimilarForward}
                canGoBack={similarProductCurrentIndex > 0}
                canGoForward={similarProductCurrentIndex < similarProductHistory.length - 1}
            />

            {/* Article Drawer */}
            <ArticleDrawer
                open={Boolean(articleDrawerProduct)}
                product={articleDrawerProduct}
                onClose={() => setArticleDrawerProduct(null)}
                onConfirm={handleArticleConfirm}
                onShowDetails={(p) => {
                    setArticleDrawerProduct(null);
                    setDetailProduct(p);
                }}
            />

            {/* Product details opened from the article drawer */}
            <ProductModal
                open={Boolean(detailProduct)}
                onClose={() => setDetailProduct(null)}
                product={detailProduct}
                products={displayedProducts}
                startIndex={Math.max(0, displayedProducts.findIndex((x) => x.id === detailProduct?.id))}
                onAddToCart={addToCart}
                onSearchSimilar={handleSearchSimilar}
                onShowArticles={handleShowArticles}
                urlParamsFlag={urlParamsFlag}
            />

            <FullPageLoader
                open={isSearchLoading && !isPendingSearchLoading}
                showLogo={lastSearchData?.mode === 'ai'}
                rotatingType={
                    lastSearchData?.mode === 'ai'
                        ? ({ 1: 'text', 2: 'image', 3: 'hybrid' }[lastSearchData?.isSearchFlag] || 'text')
                        : undefined
                }
                subtitle={
                    lastSearchData?.mode !== 'ai'
                        ? (lastSearchData?.text?.trim()
                            ? `Finding matches for "${lastSearchData.text.trim()}"`
                            : "Analyzing your design and matching collections")
                        : undefined
                }
            />
            <ReusableConfirmModal
                open={isRemoveConfirmOpen}
                onClose={() => setIsRemoveConfirmOpen(false)}
                onConfirm={executeBulkRemove}
                type="bulkRemove"
            />

            {/* AI Maintenance Modal */}
            <AiMaintenanceModal
                open={showMaintenanceModal}
                onClose={() => setShowMaintenanceModal(false)}
                onSwitchToDesign={() => setSearchMode('design')}
            />

            {/* AI Subscription Modal */}
            <AiSubscriptionModal
                open={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                variant={subscriptionVariant}
            />

            {/* AI Training Modal */}
            <AiTrainingModal
                open={showTrainingModal}
                onClose={() => setShowTrainingModal(false)}
            />
        </GridBackground >
    );
}

// Wrap with MultiSelectProvider and TokenUsageProvider
export default function ProductClient({ onInitialLoadComplete, onLoaderPropsChange }) {
    return (
        <TokenUsageProvider>
            <MultiSelectProvider>
                <ProductClientContent onInitialLoadComplete={onInitialLoadComplete} onLoaderPropsChange={onLoaderPropsChange} />
            </MultiSelectProvider>
        </TokenUsageProvider>
    );
}
