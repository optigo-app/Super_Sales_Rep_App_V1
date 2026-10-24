'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Grid, Box, Typography, Button, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';
import ProductCard from './ProductCard';
import { useMultiSelect } from '@mc/context/MultiSelectContext';

const ProductGrid = memo(function ProductGrid({
  designData,
  appliedFilters,
  clearAllFilters,
  onSearchSimilar,
  onShowArticles,
  loading = false,
  urlParamsFlag,
  restoreTargetIndex,
  isFilterOpen,
  searchTerm,
  searchMode,
  catalogView = 'design'
}) {
  const { isMultiSelectMode, isProductSelected, toggleProductSelection, selectBatch } = useMultiSelect();
  const ITEMS_PER_LOAD = 24;
  const lastIndexRef = useRef(null);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  // Slice visible items
  const visibleItems = useMemo(() => {
    return designData.slice(0, visibleCount);
  }, [designData, visibleCount]);

  // Reset range anchor when the dataset changes
  useEffect(() => {
    lastIndexRef.current = null;
  }, [designData]);

  // Ctrl+Shift+click: select the whole range from anchor to clicked card
  const handleToggleSelection = useCallback((productId, index, e) => {
    if (e?.ctrlKey && e?.shiftKey && lastIndexRef.current != null) {
      e.preventDefault();
      const start = Math.min(lastIndexRef.current, index);
      const end = Math.max(lastIndexRef.current, index);
      selectBatch(designData.slice(start, end + 1).map(p => p.id));
      return;
    }
    lastIndexRef.current = index;
    toggleProductSelection(productId);
  }, [designData, selectBatch, toggleProductSelection]);

  const hasMore = visibleCount < designData.length;

  const clampVisibleCount = useCallback((targetIndex) => {
    const idx = Number(targetIndex);
    if (!Number.isFinite(idx) || idx < 0) return ITEMS_PER_LOAD;
    const desired = Math.max(idx + 1, ITEMS_PER_LOAD);
    const rounded = Math.ceil(desired / ITEMS_PER_LOAD) * ITEMS_PER_LOAD;
    return Math.min(rounded, designData.length);
  }, [designData.length]);

  // Load more items (24 at a time)
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;

    requestAnimationFrame(() => {
      setVisibleCount(prev =>
        Math.min(prev + ITEMS_PER_LOAD, designData.length)
      );
      loadingRef.current = false;
    });
  }, [hasMore, designData.length]);

  // Intersection Observer optimized
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadMore();
        }
      },
      {
        threshold: 0,
        rootMargin: '1200px'   // 👈 load before reaching end
      }
    );

    const node = sentinelRef.current;
    if (node) observer.observe(node);

    return () => observer.disconnect();
  }, [loadMore, hasMore]);


  // Reset when data changes
  useEffect(() => {
    setVisibleCount(clampVisibleCount(restoreTargetIndex));
    loadingRef.current = false;
  }, [designData, restoreTargetIndex, clampVisibleCount]);

  // Delayed skeleton — only show if loading actually takes >200ms.
  // Memory/IndexedDB hits render instantly with no skeleton flash.
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(t);
  }, [loading]);

  // Loading State
  if (loading) {
    if (!showSkeleton) return <Box />; // brief blank beats a skeleton flash
    return (
      <Box>
        <Grid container spacing={2}>
          {Array.from({ length: 24 }).map((_, index) => (
            <Grid
              key={`skeleton-${index}`}
              size={{ xs: 6, sm: 4, md: isFilterOpen ? 4 : 3, lg: 3, xl: 2 }}
            >
              <Box sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                height: '100%'
              }}>
                <Box sx={{ pt: '100%', position: 'relative', bgcolor: 'grey.100' }}>
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
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Empty result UI
  if (designData.length === 0 && (appliedFilters.length > 0 || searchTerm)) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
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
            <SearchX size={60} color="#9e9e9e" />
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography variant="h5" fontWeight="medium" mb={2}>
            No match product found
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography variant="body1" color="text.secondary" mb={4}>
            Try adjusting your filters to see more results.
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
            onClick={clearAllFilters}
            sx={{
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: 2,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              color: 'text.white',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              '&:hover': {
                boxShadow: 'none',
                bgcolor: 'rgba(0, 0, 0, 0.06)',
                borderColor: 'rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            Clear All Filters
          </Button>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {visibleItems.map((product, index) => {
          const staggerDelay = Math.min(index * 0.012, 0.12);
          return (
            <Grid
              key={`${catalogView}-${product.id}-${index}`}
              size={{ xs: 6, sm: 4, md: isFilterOpen ? 4 : 3, lg: 3, xl: 2 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%' }}
              >
                <ProductCard
                  product={product}
                  products={designData}
                  index={index}
                  onSearchSimilar={onSearchSimilar}
                  onShowArticles={onShowArticles}
                  showSimilarButton={searchMode !== 'design'}
                  urlParamsFlag={urlParamsFlag}
                  isMultiSelectMode={isMultiSelectMode}
                  isSelected={isProductSelected(product.id)}
                  onToggleSelection={handleToggleSelection}
                />
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Single sentinel – clean & stable */}
      {hasMore && (
        <Box
          ref={sentinelRef}
          sx={{ height: '1px', width: '100%' }}
        />
      )}
    </Box>
  );
});

ProductGrid.displayName = 'ProductGrid';
export default ProductGrid;
  