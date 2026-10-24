"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const saveTimeoutRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem("cartItems");
      setItems([]);
    } catch (e) {
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Debounced sessionStorage save - only saves after 300ms of no changes
  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof window === "undefined") return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 300ms
    saveTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem("cartItems", JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart:", e);
      }
    }, 300);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [items, hasHydrated]);

  // Same design selected across catalogs → keep the richest source.
  // Priority: article (3) > stock (2) > design (1)
  const SOURCE_PRIORITY = { article: 3, stock: 2, design: 1 };

  const addToCart = useCallback((product) => {
    setItems((prev) => {
      if (!product || !product.id) return prev;
      const existingIndex = prev.findIndex((p) => p.id === product.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          quantity: (existing.quantity || 1) + 1,
          // Re-confirming articles replaces the pick set (drawer preloads
          // existing picks, so the confirmed set is the full new state)
          ...(product.selectedArticles
            ? { selectedArticles: [...new Set(product.selectedArticles)], allArticlesSelected: false }
            : {}),
        };
        return updated;
      }
      // Same designno from a different catalog → keep higher-priority source.
      // Two stock rows with the same designno are distinct barcodes — never collapse.
      const dupIndex = prev.findIndex(
        (p) => p.designno && p.designno === product.designno &&
          !(p.source === 'stock' && product.source === 'stock')
      );
      if (dupIndex !== -1) {
        const existing = prev[dupIndex];
        const existingPri = SOURCE_PRIORITY[existing.source || 'design'] || 0;
        const newPri = SOURCE_PRIORITY[product.source || 'design'] || 0;
        if (newPri <= existingPri) return prev;
        const updated = [...prev];
        updated[dupIndex] = {
          ...product,
          quantity: existing.quantity || 1,
          ...(product.source === 'article' && !product.selectedArticles?.length
            ? { allArticlesSelected: true }
            : {}),
        };
        return updated;
      }
      // Direct add of an article-catalog design = "all articles selected"
      const allArticles = product.source === 'article' && !product.selectedArticles?.length;
      return [...prev, { ...product, quantity: 1, ...(allArticles ? { allArticlesSelected: true } : {}) }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // Patch fields on an existing cart item (e.g. article picks) without
  // touching quantity — used when editing selections from the cart.
  const updateCartItem = useCallback((productId, updates) => {
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, ...updates } : item))
    );
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      await setItems([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isItemInCart = useCallback((productId) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateCartItem, clearCart, totalCount, hasHydrated, isItemInCart }),
    [items, addToCart, removeFromCart, updateCartItem, clearCart, totalCount, hasHydrated, isItemInCart, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
