"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Images, ImagePlus, Search, Send, X, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';

import {
    Container,
    Grid,
    Typography,
    Button,
    IconButton,
    Box,
    Card,
    CardMedia,
    InputBase,
} from '@mui/material';

import { useToast } from '@mc/context/ToastContext';
import { assetPath } from '@mc/utils/paths';
import { getAlbumDesignViewApi } from '@mc/app/api/albumApi';
import GridBackground from '../Common/GridBackground';
import PageHeader from '../Common/PageHeader';
import FullPageLoader from '../FullPageLoader';
import ImageViewerModal from '../Common/modals/ImageViewerModal';
import SendAlbumDialog from './SendAlbumDialog';

// Ordered image-URL candidates — the API returns ImageName + imgrandomno
// (folder) plus path bases in rd1 meta, so try each shape in turn
const getRowImageCandidates = (row, meta) => {
    const name = row.ImageName || row.imagename || row.imageName || row.DefaultImageName;
    const bases = [meta?.ThumbPath, meta?.OriginalPath, row.frontenddomainpath, row.DomainPath]
        .filter(Boolean)
        .map((b) => (b.endsWith('/') ? b : `${b}/`));
    const candidates = [row.image || row.ImageUrl || row.thumbUrl || row.ThumbUrl];
    bases.forEach((base) => {
        if (name) candidates.push(`${base}${row.imgrandomno ? `${row.imgrandomno}/` : ''}${name}`);
        if (name) candidates.push(`${base}${name}`);
    });
    return candidates.filter(Boolean);
};

const getRowCode = (row) =>
    row.designno || row.DesignNo || row.Designno || row.ArticleNo || row.articleno || row.Code || row.sku || `#${row.id ?? ''}`;

// Label/value pairs shown under each design code
const getRowDetails = (row) =>
    [
        ['Collection', row.MasterManagement_collectioncollectionname || row.collectionname],
        ['Category', row.MasterManagement_categoryname],
        ['Subcategory', row.MasterManagement_subcategoryname],
        ['Make Type', row.mastermanagement_maketypename],
        ['Metal Color', row.goldcolorname || row.metalcolorname],
        ['Gold Type', row.goldtypename],
        ['Gross Wt', row.ActualGrossweight != null && row.ActualGrossweight !== 0 ? `${row.ActualGrossweight} gm` : null],
        ['Dia Ctw', row.diamondctw != null && row.diamondctw !== 0 ? row.diamondctw : null],
    ].filter(([, v]) => v != null && String(v).trim() !== '');

const AlbumViewClient = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const albumId = searchParams.get('id') || searchParams.get('albumid');
    const albumName = searchParams.get('name') || 'Album';
    const { showError } = useToast();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageSteps, setImageSteps] = useState({});

    // Search + expanded viewer + send dialog
    const [searchText, setSearchText] = useState('');
    const [viewerRow, setViewerRow] = useState(null);
    const [sendOpen, setSendOpen] = useState(false);

    const fetchDesigns = useCallback(async () => {
        if (!albumId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await getAlbumDesignViewApi(albumId);
            // rd = design rows; rd1 meta carries ThumbPath/OriginalPath image bases
            const list = data?.rd || Object.values(data || {}).find(v => Array.isArray(v)) || [];
            setRows(Array.isArray(list) ? list : []);
            setMeta(Array.isArray(data?.rd1) ? data.rd1[0] : null);
        } catch (err) {
            console.error('ProAlbum_AlbumDesignView Error:', err);
            showError('Failed to load album designs');
        } finally {
            setLoading(false);
        }
    }, [albumId, showError]);

    useEffect(() => {
        fetchDesigns();
    }, [fetchDesigns]);

    const visibleRows = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) =>
            String(getRowCode(row)).toLowerCase().includes(q) ||
            Object.values(row).some(v => typeof v === 'string' && v.toLowerCase().includes(q))
        );
    }, [rows, searchText]);

    const handleAddMore = () => {
        if (albumId) {
            sessionStorage.setItem('albumId', String(albumId));
            sessionStorage.setItem('albumName', albumName);
        }
        router.push(`/magicCatalog/product${albumId ? `?albumid=${albumId}` : ''}`);
    };



    return (
        <GridBackground>
            <Container maxWidth="false" sx={{ position: 'relative', zIndex: 2, pb: '60px', px: '0 !important' }}>
                <PageHeader
                    centerTitle={albumName}
                    centerIcon={Images}
                    leftContent={
                        <>
                            <IconButton onClick={() => router.push('/magicCatalog/albums')} aria-label="Go back">
                                <ArrowLeft size={20} />
                            </IconButton>
                            {rows.length > 0 && (
                                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: 'inherit', opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
                                    {rows.length} design{rows.length === 1 ? '' : 's'}
                                </Typography>
                            )}
                        </>
                    }
                    rightContent={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <IconButton
                                onClick={handleAddMore}
                                aria-label="Add more designs"
                                sx={{
                                    width: 36, height: 36,
                                    bgcolor: 'rgba(0,0,0,0.04)',
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: 'rgba(115,103,240,0.12)', color: 'primary.main' },
                                }}
                            >
                                <ImagePlus size={17} />
                            </IconButton>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Send size={14} />}
                                onClick={() => setSendOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    fontSize: '0.78rem',
                                    px: { xs: 1.25, sm: 2 },
                                    background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                                    boxShadow: '0 4px 12px rgba(115,103,240,0.3)',
                                    '&:hover': { background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)' },
                                }}
                            >
                                Send
                            </Button>
                        </Box>
                    }
                />

                {/* Search bar — always visible, sticks under the header on scroll */}
                <Box sx={{
                    position: 'sticky',
                    top: 48,
                    zIndex: 99,
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(244, 244, 250, 0.82)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        maxWidth: 720, mx: 'auto',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(115,103,240,0.18)',
                        borderRadius: '24px', px: 1.75, py: 0.25,
                        boxShadow: '0 4px 16px rgba(115,103,240,0.08)',
                    }}>
                        <Search size={16} color="#7367f0" />
                        <InputBase
                            fullWidth
                            placeholder="Search designs in this album..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{ fontSize: '0.85rem', py: 0.5 }}
                        />
                        {searchText && (
                            <IconButton size="small" onClick={() => setSearchText('')} sx={{ p: 0.25 }}>
                                <X size={14} />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {visibleRows.length > 0 && (
                    <Grid container spacing={1.5} sx={{ p: '10px 16px !important', mt: 1 }}>
                        {visibleRows.map((row, index) => {
                            const code = getRowCode(row);
                            const rowKey = `${row.id ?? code}-${index}`;
                            const candidates = getRowImageCandidates(row, meta);
                            const step = imageSteps[rowKey] || 0;
                            const src = step < candidates.length ? candidates[step] : assetPath('/images/image-not-found.jpg');
                            const details = getRowDetails(row);
                            return (
                                <Grid key={rowKey} size={{ xs: 6, sm: 4, md: 3, lg: 3, xl: 2 }}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                                        style={{ height: '100%' }}
                                    >
                                        <Card
                                            onClick={() => setViewerRow({ src, code })}
                                            sx={{
                                                position: 'relative',
                                                overflow: 'hidden',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: 2.5,
                                                cursor: 'zoom-in',
                                                transition: 'box-shadow 0.3s ease, transform 0.25s ease',
                                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.10)' },
                                                '&:active': { transform: 'scale(0.97)' },
                                            }}
                                        >
                                            <Box sx={{ position: 'relative', width: '100%', pt: '100%', overflow: 'hidden', bgcolor: 'grey.50' }}>
                                                <CardMedia
                                                    component="img"
                                                    image={src}
                                                    alt={code}
                                                    sx={{
                                                        position: 'absolute', top: 0, left: 0,
                                                        width: '100%', height: '100%',
                                                        objectFit: 'contain', p: 0.5,
                                                        transition: 'transform 0.3s',
                                                        '&:hover': { transform: 'scale(1.05)' },
                                                    }}
                                                    onError={() => setImageSteps(prev => ({ ...prev, [rowKey]: (prev[rowKey] || 0) + 1 }))}
                                                />
                                                {/* Expand hint */}
                                                <Box sx={{
                                                    position: 'absolute', bottom: 6, right: 6,
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    bgcolor: 'rgba(255,255,255,0.92)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
                                                    color: 'primary.main',
                                                    pointerEvents: 'none',
                                                }}>
                                                    <ZoomIn size={13} />
                                                </Box>
                                            </Box>
                                            <Box sx={{ px: 1.25, py: 0.9, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    align="center"
                                                    title={code}
                                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', mb: details.length ? 0.5 : 0 }}
                                                >
                                                    {code}
                                                </Typography>
                                                {details.length > 0 && (
                                                    <Box
                                                        onClick={(e) => e.stopPropagation()}
                                                        sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, cursor: 'default' }}
                                                    >
                                                        {details.map(([label, value]) => (
                                                            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                                                                <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', flexShrink: 0 }}>
                                                                    {label}
                                                                </Typography>
                                                                <Typography
                                                                    title={String(value)}
                                                                    sx={{
                                                                        fontSize: '0.66rem',
                                                                        fontWeight: 600,
                                                                        color: 'text.primary',
                                                                        textAlign: 'right',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {value}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* No matches for the search */}
                {!loading && rows.length > 0 && visibleRows.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>No matches</Typography>
                        <Typography variant="body2" color="text.secondary">
                            No designs match "{searchText}".
                        </Typography>
                    </Box>
                )}

                {!loading && rows.length === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 4, textAlign: 'center' }}>
                        <Box sx={{
                            width: 110, height: 110, borderRadius: '50%', bgcolor: 'grey.100',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                        }}>
                            <Images size={52} color="#9e9e9e" />
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Album is empty</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
                            Add designs from the catalog to fill this album.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<ImagePlus size={16} />}
                            onClick={handleAddMore}
                            sx={{
                                textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3,
                                background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                            }}
                        >
                            Add Designs
                        </Button>
                    </Box>
                )}
            </Container>

            {/* Expanded design view — zoom / rotate / fullscreen */}
            <ImageViewerModal
                open={Boolean(viewerRow)}
                onClose={() => setViewerRow(null)}
                imageUrl={viewerRow?.src}
                altText={viewerRow?.code || 'Design'}
            />

            {/* Send this album — catalog-share flow */}
            <SendAlbumDialog
                open={sendOpen}
                onClose={() => setSendOpen(false)}
                album={{ id: albumId, albumName }}
            />

            <FullPageLoader open={loading} message="Loading album..." />
        </GridBackground>
    );
};

export default AlbumViewClient;
