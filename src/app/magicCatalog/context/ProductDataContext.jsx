"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { designCollectionApi } from '@mc/app/api/designCollectionApi';
import { stockCollectionApi } from '@mc/app/api/stockCollectionApi';
import { articleCatalogApi } from '@mc/app/api/articleCollectionApi';
import { getCachedCatalog, setCachedCatalog, clearCatalogCache } from '@mc/utils/catalogCache';

const ProductDataContext = createContext(undefined);

export const CATALOG_VIEWS = ['design', 'stock', 'article'];

const CATALOG_API_MAP = {
    design: designCollectionApi,
    stock: stockCollectionApi,
    article: articleCatalogApi,
};

export const mapProducts = (res, view = 'design') => {
    const allProducts = res?.rd || [];
    const meta = Array.isArray(res?.rd1) ? res.rd1[0] : undefined;
    const thumbBaseRaw = meta?.ThumbPath || "";
    const originalBaseRaw = meta?.OriginalPath || "";
    const thumbBase = thumbBaseRaw && !thumbBaseRaw.endsWith('/') ? `${thumbBaseRaw}/` : thumbBaseRaw;
    const originalBase = originalBaseRaw && !originalBaseRaw.endsWith('/') ? `${originalBaseRaw}/` : originalBaseRaw;
    if (meta?.ImageuKey) sessionStorage.setItem('ukey', meta.ImageuKey);
    if (meta?.AIAPI) sessionStorage.setItem('aiApi', meta.AIAPI);
    return allProducts.map((p, idx) => {
        const thumbUrl =
            p?.ImgUrl ||
            (p?.ThumbImageName ? `${thumbBase}${p.ThumbImageName}` : undefined);
        const originalUrl = p?.OriginalImageName
            ? `${originalBase}${p.OriginalImageName}`
            : p?.ImgUrl;
        // Stock items can share a designno — StockBarcode is the unique key.
        // Article rows are unique per variant — ArticleMasterCode is the key.
        // Use || (not ??) so empty strings fall through instead of
        // producing identical ids that collide in cart/selection.
        const rawId =
            view === 'stock'
                ? (p?.StockBarcode || p?.id || p?.autocode || `${p?.designno || 'row'}-${idx}`)
                : view === 'article'
                    ? (p?.ArticleMasterCode || p?.autocode || p?.AutoCode || `${p?.DesignNo || p?.designno || 'row'}-${p?.ArticleNo ?? idx}`)
                    : (p?.id || p?.autocode || p?.designno || `row-${idx}`);
        return {
            ...p,
            // rawId preserves the backend id; id is composite so design/stock
            // items never collide in cart, selection, or grid keys
            rawId,
            source: view,
            id: `${view}:${rawId}`,
            // Article API returns PascalCase fields — normalize to the
            // camelCase/lowercase names the rest of the app uses
            designno: p?.designno || p?.DesignNo || "",
            articlemastercode: p?.ArticleMasterCode || p?.articlemastercode || "",
            articleno: p?.ArticleNo ?? p?.articleno,
            autocode: p?.autocode ?? p?.AutoCode ?? "",
            metaltypename: p?.metaltypename || p?.metaltype || "",
            metalcolorname: p?.metalcolorname || p?.metalcolor || "",
            grosswt: p?.grosswt ?? p?.ActualGrossweight ?? p?.GrossWt,
            // Normalize stock API's typo'd field so filters/search match both shapes
            occasionname: p?.occasionname || p?.occassionname || "",
            thumbUrl,
            originalUrl,
        };
    });
};

export const ProductDataProvider = ({ children }) => {
    const [catalogData, setCatalogData] = useState({ design: [], stock: [], article: [] });
    const [catalogLoading, setCatalogLoading] = useState({ design: false, stock: false, article: false });
    const [catalogError, setCatalogError] = useState({ design: null, stock: null, article: null });
    const [pendingSearch, setPendingSearch] = useState(null);
    const inFlightRef = useRef({});
    const abortRef = useRef({});
    // Mirror of catalogData so fetchCatalog can stay referentially stable —
    // effects depending on it must not re-fire after every catalog update
    const dataRef = useRef(catalogData);
    useEffect(() => { dataRef.current = catalogData; });

    const fetchCatalog = useCallback(async (view = 'design', force = false) => {
        // Dedup: reuse in-flight request or cached data
        if (!force && inFlightRef.current[view]) return inFlightRef.current[view];
        if (dataRef.current[view]?.length > 0 && !force) {
            return dataRef.current[view];
        }

        // A new request for this view supersedes any in-flight one — abort it
        abortRef.current[view]?.abort();
        const controller = new AbortController();
        abortRef.current[view] = controller;

        const apiFn = CATALOG_API_MAP[view] || designCollectionApi;
        const promise = (async () => {
            setCatalogLoading(prev => ({ ...prev, [view]: true }));
            setCatalogError(prev => ({ ...prev, [view]: null }));
            try {
                // IndexedDB cache hit — instant switch, skip network entirely
                if (!force) {
                    const cached = await getCachedCatalog(view);
                    if (cached?.length) {
                        setCatalogData(prev => ({ ...prev, [view]: cached }));
                        return cached;
                    }
                }
                const res = await apiFn({ signal: controller.signal });
                // Aborted while in flight — discard, don't touch state
                if (controller.signal.aborted) return dataRef.current[view] || [];
                const mapped = mapProducts(res, view);
                setCatalogData(prev => ({ ...prev, [view]: mapped }));
                setCachedCatalog(view, mapped).catch(() => {});
                return mapped;
            } catch (err) {
                if (err?.name === 'AbortError' || controller.signal.aborted) {
                    return dataRef.current[view] || [];
                }
                console.error(`Failed to fetch ${view} catalog:`, err);
                setCatalogError(prev => ({ ...prev, [view]: err.message || 'Failed to load products' }));
                throw err;
            } finally {
                // Only the latest request clears its loading flag
                if (abortRef.current[view] === controller) {
                    setCatalogLoading(prev => ({ ...prev, [view]: false }));
                }
            }
        })();

        inFlightRef.current[view] = promise;
        try {
            return await promise;
        } finally {
            // Only clear if this promise is still the registered one —
            // an aborted fetch must not remove a newer in-flight request
            if (inFlightRef.current[view] === promise) {
                delete inFlightRef.current[view];
            }
        }
    }, []);

    const clearProductData = useCallback(() => {
        setCatalogData({ design: [], stock: [], article: [] });
        setCatalogError({ design: null, stock: null, article: null });
        clearCatalogCache().catch(() => {});
    }, []);

    const value = useMemo(() => ({
        // Backwards-compatible design aliases
        productData: catalogData.design,
        isLoading: catalogLoading.design,
        error: catalogError.design,
        fetchProductData: (force) => fetchCatalog('design', force),
        clearProductData,
        // Multi-catalog API
        catalogData,
        catalogLoading,
        catalogError,
        fetchCatalog,
        pendingSearch,
        setPendingSearch
    }), [catalogData, catalogLoading, catalogError, fetchCatalog, clearProductData, pendingSearch]);

    return (
        <ProductDataContext.Provider value={value}>
            {children}
        </ProductDataContext.Provider>
    );
};

export const useProductData = () => {
    const context = useContext(ProductDataContext);
    if (context === undefined) {
        throw new Error('useProductData must be used within a ProductDataProvider');
    }
    return context;
};
