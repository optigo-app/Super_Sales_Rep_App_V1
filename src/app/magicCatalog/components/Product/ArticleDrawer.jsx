"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback, useDeferredValue } from "react";
import { Drawer, Box, Typography, Button, IconButton, TextField, InputAdornment, CircularProgress } from "@mui/material";
import { X, Search, Eye } from "lucide-react";
import { getDesignArticlesApi } from "@mc/app/api/articleCollectionApi";
import { assetPath } from "@mc/utils/paths";

// Map a getarticle API row to the drawer's article shape
const mapArticleRow = (row, i, designno) => ({
    id: `art:${row.autocode ?? designno}:${row.ArticleNo ?? i}`,
    articleno: row.ArticleNo ?? i + 1,
    articlemastercode: row.ArticleMasterCode || row.articlemastercode || "",
    autocode: row.autocode || "",
    designno: row.DesignNo || designno,
    metaltypename: row.metaltypename || "",
    metalcolorname: row.metalcolorname || "",
    diamondclarityname: row.diamondclarityname || "",
    diamondcolorname: row.diamondcolorname || "",
    csqualityname: row.csqualityname || "",
    cscolorname: row.cscolorname || "",
    findingtypename: row._findingtypename || "",
});

export default function ArticleDrawer({ open, onClose, product, onConfirm, onShowDetails }) {
    const [selected, setSelected] = useState(() => new Set());
    const [searchInput, setSearchInput] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [apiRows, setApiRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const designno = (product?.designno || product?.DesignNo) || (product?.autocode || product?.Autocode) || "";
    const articles = useMemo(
        () => {
            const seen = new Map();
            return apiRows.map((row, i) => {
                const article = mapArticleRow(row, i, designno);
                const count = seen.get(article.id) || 0;
                seen.set(article.id, count + 1);
                return count ? { ...article, id: `${article.id}:${count}` } : article;
            });
        },
        [apiRows, designno]
    );

    // Fetch articles for this design when the drawer opens
    useEffect(() => {
        if (!open || !designno) return;
        let cancelled = false;
        const controller = new AbortController();
        setIsLoading(true);
        setLoadError(null);
        setApiRows([]);

        (async () => {
            try {
                const res = await getDesignArticlesApi(designno, { signal: controller.signal });
                if (!cancelled) setApiRows(Array.isArray(res?.rd) ? res.rd : []);
            } catch (err) {
                if (!cancelled && err?.name !== 'AbortError') {
                    setLoadError('Failed to load articles');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [open, designno]);

    // Debounce input so filtering doesn't run on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(searchInput), 200);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const deferredTerm = useDeferredValue(debouncedTerm);

    const searchIndex = useMemo(
        () => articles.map((a) =>
            `${a.articleno} ${a.designno} ${a.metaltypename} ${a.metalcolorname} ${a.diamondclarityname} ${a.diamondcolorname} ${a.csqualityname} ${a.cscolorname} ${a.findingtypename}`.toLowerCase()
        ),
        [articles]
    );

    const filteredArticles = useMemo(() => {
        const q = deferredTerm.trim().toLowerCase();
        if (!q) return articles;
        const tokens = q.split(/\s+/).filter(Boolean);
        return articles.filter((_, i) =>
            tokens.every((t) => searchIndex[i].includes(t))
        );
    }, [articles, deferredTerm, searchIndex]);

    const MAX_RENDERED = 200;
    const visibleArticles = useMemo(
        () => filteredArticles.slice(0, MAX_RENDERED),
        [filteredArticles]
    );

    const dragRef = useRef(null); // { add: boolean, originId, moved }
    const dragEndAtRef = useRef(0); // timestamp of last real drag end
    const lastIndexRef = useRef(-1);
    const scrollBoxRef = useRef(null);

    useEffect(() => {
        if (open) {
            // Preload prior picks — accepts stored article objects or plain ids
            setSelected(new Set((product?.selectedArticles || []).map((a) => a?.id ?? a)));
            setSearchInput("");
            setDebouncedTerm("");
            lastIndexRef.current = -1;
        }
    }, [open, designno]);

    useEffect(() => {
        if (
            open &&
            product?.allArticlesSelected &&
            !(product?.selectedArticles?.length) &&
            articles.length > 0
        ) {
            setSelected((prev) =>
                prev.size === 0 ? new Set(articles.map((a) => a.id)) : prev
            );
        }
    }, [open, product, articles]);

    // End drag on mouseup anywhere; record timestamp so the synthetic
    // trailing click (~0-5ms later) is suppressed, but future real
    // clicks are never swallowed — even when it lands on the grid
    // container instead of a card
    useEffect(() => {
        const handleUp = () => {
            if (dragRef.current?.moved) dragEndAtRef.current = Date.now();
            dragRef.current = null;
        };
        window.addEventListener("mouseup", handleUp);
        return () => window.removeEventListener("mouseup", handleUp);
    }, []);

    const applyToIds = useCallback((ids, add) => {
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (add ? next.add(id) : next.delete(id)));
            return next;
        });
    }, []);

    const toggleArticle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Select/deselect everything in the current filtered view —
    // works on the search-filtered set so "Select All" respects the query
    const allFilteredSelected = filteredArticles.length > 0
        && filteredArticles.every((a) => selected.has(a.id));

    const handleSelectAllToggle = () => {
        setSelected((prev) => {
            const allSel = filteredArticles.every((a) => prev.has(a.id));
            const next = new Set(prev);
            filteredArticles.forEach((a) => (allSel ? next.delete(a.id) : next.add(a.id)));
            return next;
        });
    };

    const handleCardMouseDown = (e, id) => {
        if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault(); // avoid text/image drag artifacts
        dragRef.current = { add: !selected.has(id), originId: id, moved: false };
    };

    const handleCardMouseEnter = (id) => {
        const drag = dragRef.current;
        if (!drag) return;
        if (!drag.moved) {
            drag.moved = true;
            applyToIds([drag.originId], drag.add); // include the drag origin
        }
        applyToIds([id], drag.add);
    };

    // Auto-scroll the list while dragging near its edges
    const handleScrollAreaMouseMove = (e) => {
        if (!dragRef.current) return;
        const box = scrollBoxRef.current;
        if (!box) return;
        const rect = box.getBoundingClientRect();
        const EDGE = 60;
        const SPEED = 14;
        if (e.clientY < rect.top + EDGE) box.scrollTop -= SPEED;
        else if (e.clientY > rect.bottom - EDGE) box.scrollTop += SPEED;
    };

    const handleCardClick = (e, id, index) => {
        // If a drag just ended, swallow the trailing synthetic click
        if (Date.now() - dragEndAtRef.current < 150) return;

        // Ctrl+Shift+click: range select from last clicked card to this one
        if (e.ctrlKey && e.shiftKey && lastIndexRef.current >= 0) {
            const [from, to] = [
                Math.min(lastIndexRef.current, index),
                Math.max(lastIndexRef.current, index),
            ];
            applyToIds(visibleArticles.slice(from, to + 1).map((a) => a.id), true);
            return;
        }

        toggleArticle(id);
        lastIndexRef.current = index;
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 560, md: 620 },
                    display: "flex",
                    flexDirection: "column",
                    borderTopLeftRadius: { xs: 0, sm: "20px" },
                    borderBottomLeftRadius: { xs: 0, sm: "20px" },
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    pt: 3,
                    pb: 2,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(115,103,240,0.12)",
                    bgcolor: "rgba(115,103,240,0.05)",
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                    {/* Product reference thumbnail */}
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "12px",
                            overflow: "hidden",
                            bgcolor: "#fff",
                            border: "1px solid rgba(115,103,240,0.15)",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Box
                            component="img"
                            src={product?.thumbUrl || product?.image || assetPath("/images/image-not-found.jpg")}
                            alt={designno}
                            onError={(e) => { e.currentTarget.src = assetPath("/images/image-not-found.jpg"); }}
                            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "#7367f0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Articles for Design
                        </Typography>
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: "1.25rem",
                                color: "#202124",
                                lineHeight: 1.15,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {designno}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "0.72rem",
                                color: "#5f6368",
                                mt: 0.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {[product?.categoryname, product?.collectionname, product?.metaltype].filter(Boolean).join(" · ") || "Design"}
                            {" · "}
                            {deferredTerm.trim() ? `${filteredArticles.length} of ${articles.length}` : articles.length} articles
                            {selected.size > 0 && ` · ${selected.size} selected`}
                        </Typography>
                    </Box>
                </Box>

                {/* Right side: select/deselect all + close */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                    {filteredArticles.length > 0 && (
                        <Button
                            size="small"
                            onClick={handleSelectAllToggle}
                            sx={{
                                textTransform: "none",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#5e56d6",
                                borderRadius: "8px",
                                px: 1.5,
                                minWidth: "auto",
                                "&:hover": { bgcolor: "rgba(115,103,240,0.1)" },
                            }}
                        >
                            {allFilteredSelected ? "Deselect All" : "Select All"}
                        </Button>
                    )}
                    {onShowDetails && (
                        <IconButton
                            size="small"
                            onClick={() => onShowDetails(product)}
                            title="View product details"
                            sx={{
                                color: "#7367f0",
                                flexShrink: 0,
                                bgcolor: "rgba(115,103,240,0.10)",
                                border: "1px solid rgba(115,103,240,0.16)",
                                borderRadius: "10px",
                                width: 34,
                                height: 34,
                                "&:hover": { bgcolor: "rgba(115,103,240,0.18)" },
                            }}
                        >
                            <Eye size={17} />
                        </IconButton>
                    )}
                    <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary", flexShrink: 0 }}>
                        <X size={20} />
                    </IconButton>
                </Box>
            </Box>

            {/* Search */}
            <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid rgba(115,103,240,0.08)", flexShrink: 0 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search articles — code, purity, metal, size..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={16} color="#7367f0" />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '16px !important',
                            fontSize: "0.85rem",
                            bgcolor: "#faf9fe",
                            transition: "box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                            "& fieldset": {
                                borderColor: "#ececec",
                            },
                            "&:hover fieldset": {
                                borderColor: "rgba(115,103,240,0.45)",
                            },
                            "&.Mui-focused": {
                                bgcolor: "#fff",
                                boxShadow: "0 0 0 4px rgba(115,103,240,0.08)",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "#7367f0",
                            },
                        },
                    }}
                />
            </Box>

            {/* Scrollable article cards */}
            <Box
                ref={scrollBoxRef}
                onMouseMove={handleScrollAreaMouseMove}
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 3,
                    py: 2.5,
                    "&::-webkit-scrollbar": { width: 7 },
                    "&::-webkit-scrollbar-thumb": { background: "#d8d8d8", borderRadius: 20 },
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: 1.5,
                    }}
                >
                    {isLoading && (
                        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 8 }}>
                            <CircularProgress size={28} sx={{ color: '#7367f0' }} />
                            <Typography sx={{ fontSize: "0.8rem", color: "#9e9e9e", mt: 1.5 }}>
                                Loading articles for {designno}…
                            </Typography>
                        </Box>
                    )}
                    {!isLoading && loadError && (
                        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 6 }}>
                            <Typography sx={{ fontSize: "0.85rem", color: "#d32f2f" }}>
                                {loadError}
                            </Typography>
                        </Box>
                    )}
                    {!isLoading && !loadError && filteredArticles.length === 0 && (
                        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 6 }}>
                            <Typography sx={{ fontSize: "0.85rem", color: "#9e9e9e" }}>
                                {deferredTerm.trim()
                                    ? `No articles match "${deferredTerm}"`
                                    : 'No articles found for this design'}
                            </Typography>
                        </Box>
                    )}
                    {visibleArticles.map((article, index) => {
                        const isSelected = selected.has(article.id);
                        return (
                            <Box
                                key={article.id}
                                onMouseDown={(e) => handleCardMouseDown(e, article.id)}
                                onMouseEnter={() => handleCardMouseEnter(article.id)}
                                onClick={(e) => handleCardClick(e, article.id, index)}
                                sx={{
                                    border: `1.5px solid ${isSelected ? "#7367f0" : "#ececec"}`,
                                    bgcolor: isSelected ? "rgba(115,103,240,0.1)" : "#faf9fe",
                                    borderRadius: "14px",
                                    px: 1.25,
                                    py: 1.5,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                                    "&:hover": {
                                        borderColor: "#7367f0",
                                        bgcolor: isSelected ? "rgba(115,103,240,0.1)" : "rgba(115,103,240,0.04)",
                                        boxShadow: "0 4px 12px rgba(115,103,240,0.12)",
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "0.8rem",
                                        fontWeight: 700,
                                        color: isSelected ? "#5e56d6" : "#202124",
                                        lineHeight: 1.25,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    Art {article.articleno}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        color: "#6b7280",
                                        mt: 0.25,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {[article.metaltypename, article.metalcolorname].filter(Boolean).join(" · ")}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: "0.68rem",
                                        color: "#9e9e9e",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {[article.diamondclarityname, article.diamondcolorname].filter(Boolean).join(" · ")}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: "0.68rem",
                                        mt: 0.6,
                                        fontWeight: 600,
                                        color: "#7367f0",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {[article.csqualityname, article.cscolorname, article.findingtypename]
                                        .filter(Boolean)
                                        .join(" · ") || "\u00A0"}
                                </Typography>
                            </Box>
                        );
                    })}
                    {filteredArticles.length > MAX_RENDERED && (
                        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 2 }}>
                            <Typography sx={{ fontSize: "0.75rem", color: "#9e9e9e" }}>
                                Showing {MAX_RENDERED} of {filteredArticles.length} matches — refine your search
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 2.5, pt: 1.5, borderTop: "1px solid rgba(115,103,240,0.12)", flexShrink: 0 }}>
                <Typography
                    sx={{
                        fontSize: "0.68rem",
                        color: "#9e9e9e",
                        textAlign: "center",
                        mb: 1.5,
                    }}
                >
                    Drag to select · Ctrl+Shift+click to select a range
                </Typography>
                <Button
                    fullWidth
                    variant="contained"
                    disabled={selected.size === 0}
                    onClick={() => onConfirm?.(articles.filter((a) => selected.has(a.id)), product)}
                    sx={{
                        py: 1.5,
                        borderRadius: "14px",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        fontSize: "0.9rem",
                        background: "linear-gradient(270deg, rgba(115,103,240,0.7) 0%, #7367f0 100%)",
                        "&:hover": {
                            background: "linear-gradient(270deg, rgba(115,103,240,0.85) 0%, #5e56d6 100%)",
                        },
                        "&:disabled": {
                            background: "#e0e0e0",
                            color: "#9e9e9e",
                        },
                    }}
                >
                    Confirm Selection{selected.size > 0 ? ` (${selected.size})` : ""}
                </Button>
            </Box>
        </Drawer>
    );
}
