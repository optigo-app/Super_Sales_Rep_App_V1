"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Send, CalendarDays, Layers, User, Mail,
    Eye, Heart, ShoppingCart, Package, Globe2, Clock,
    Search, X,
} from 'lucide-react';
import { motion } from 'framer-motion';

import {
    Container,
    Grid,
    Typography,
    IconButton,
    Box,
    Card,
    Chip,
    InputBase,
} from '@mui/material';

import { useToast } from '@mc/context/ToastContext';
import { getProAlbumSentListApi } from '@mc/app/api/albumApi';
import GridBackground from '../Common/GridBackground';
import PageHeader from '../Common/PageHeader';
import FullPageLoader from '../FullPageLoader';

// customercode arrives as HTML spans — keep the plain text
const stripHtml = (html) =>
    (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const fmtExpiry = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const accessChip = (row) => {
    const disabled = Number(row.IsAccessDisabled) === 1;
    const status = String(row.AccessStatus || '').toLowerCase();
    if (disabled || status === 'disabled') {
        return { label: 'Disabled', color: 'error.main', bg: 'rgba(244,67,54,0.10)' };
    }
    if (status === 'expired' || (row.AccessExpiryDt && new Date(row.AccessExpiryDt) < new Date())) {
        return { label: 'Expired', color: '#e8830c', bg: 'rgba(232,131,12,0.10)' };
    }
    return { label: row.AccessStatus || 'Active', color: '#0f9d77', bg: 'rgba(15,157,119,0.10)' };
};

const StatItem = ({ icon: Icon, value, label }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
            <Icon size={12} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                {value ?? 0}
            </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.56rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {label}
        </Typography>
    </Box>
);

const AlbumSentListClient = () => {
    const router = useRouter();
    const { showError } = useToast();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    const fetchSent = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProAlbumSentListApi();
            setRows(data?.rd || []);
        } catch (err) {
            console.error('ProAlbum_CustomerEmailBind_List Error:', err);
            showError('Failed to load Send Albums');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchSent();
    }, [fetchSent]);

    const totalCount = useMemo(() => rows[0]?.icount ?? rows.length, [rows]);

    const visibleRows = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) =>
            [row.albumName, row.albumcode, row.firstname, row.email1,
             row.AccessStatus, stripHtml(row.customercode)]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [rows, searchText]);

    return (
        <GridBackground>
            <Container maxWidth="false" sx={{ position: 'relative', zIndex: 2, pb: '60px', px: '0 !important' }}>
                <PageHeader
                    centerTitle="Send Albums"
                    centerIcon={Send}
                    leftContent={
                        <>
                            <IconButton onClick={() => router.push('/')} aria-label="Go back">
                                <ArrowLeft size={20} />
                            </IconButton>
                            {rows.length > 0 && (
                                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: 'inherit', opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
                                    {totalCount} sent
                                </Typography>
                            )}
                        </>
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
                            placeholder="Search album, customer, email..."
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

                <Grid container spacing={1.5} sx={{ p: '10px 16px !important', mt: 0.5, maxWidth: 1200, mx: 'auto' }}>
                    {visibleRows.map((row, index) => {
                        const chip = accessChip(row);
                        const customerName = [row.firstname, stripHtml(row.customercode).replace(row.firstname || '', '').trim()]
                            .filter(Boolean).join(' · ').replace(/\s+·\s*$/, '');
                        const expiry = fmtExpiry(row.AccessExpiryDt);
                        return (
                            <Grid key={row.id ?? index} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Card sx={{
                                        borderRadius: 2.5,
                                        p: 1.5,
                                        transition: 'box-shadow 0.3s ease',
                                        '&:hover': { boxShadow: '0 10px 24px rgba(0,0,0,0.10)' },
                                    }}>
                                        {/* Album + access status */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    fontWeight={700}
                                                    fontSize="0.92rem"
                                                    title={row.albumName}
                                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                >
                                                    {row.albumName}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 0.3 }}>
                                                    {row.albumcode && (
                                                        <Typography sx={{ fontSize: '0.66rem', color: 'primary.main', fontWeight: 600 }}>
                                                            {row.albumcode}
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
                                                        <CalendarDays size={11} />
                                                        <Typography sx={{ fontSize: '0.68rem' }}>{row.EntryDate1}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'primary.main' }}>
                                                        <Layers size={11} />
                                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                            {row.AlbumTotalDesigns ?? 0} designs
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Chip
                                                icon={<Globe2 size={10} />}
                                                label={chip.label}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    bgcolor: chip.bg,
                                                    color: chip.color,
                                                    '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                }}
                                            />
                                        </Box>

                                        {/* Customer */}
                                        <Box sx={{
                                            mt: 1.25, p: 1, borderRadius: 1.5,
                                            bgcolor: 'rgba(115,103,240,0.05)', border: '1px solid rgba(115,103,240,0.12)',
                                            display: 'flex', alignItems: 'center', gap: 1,
                                        }}>
                                            <Box sx={{
                                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                                bgcolor: 'rgba(115,103,240,0.12)', color: 'primary.main',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <User size={15} />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography fontSize="0.8rem" fontWeight={700} noWrap>
                                                    {customerName || row.firstname || 'Customer'}
                                                </Typography>
                                                {row.email1 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, minWidth: 0 }}>
                                                        <Mail size={10} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                                        <Typography fontSize="0.66rem" color="text.secondary" noWrap>
                                                            {row.email1}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Stats + expiry */}
                                        <Box sx={{
                                            mt: 1.25, pt: 1,
                                            borderTop: '1px solid rgba(0,0,0,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                            <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 } }}>
                                                <StatItem icon={Eye} value={row.TotalView} label="Views" />
                                                <StatItem icon={Heart} value={row.TotalLike} label="Likes" />
                                                <StatItem icon={ShoppingCart} value={row.TotalInCart} label="Cart" />
                                                <StatItem icon={Package} value={row.TotalOrder} label="Orders" />
                                            </Box>
                                            {expiry && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary', flexShrink: 0 }}>
                                                    <Clock size={10} />
                                                    <Typography sx={{ fontSize: '0.6rem' }}>
                                                        till {expiry}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* No matches for the search */}
                {!loading && rows.length > 0 && visibleRows.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>No matches</Typography>
                        <Typography variant="body2" color="text.secondary">
                            No Send Albums match "{searchText}".
                        </Typography>
                    </Box>
                )}

                {/* Empty state */}
                {!loading && rows.length === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 4, textAlign: 'center' }}>
                        <Box sx={{
                            width: 110, height: 110, borderRadius: '50%', bgcolor: 'grey.100',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                        }}>
                            <Send size={52} color="#9e9e9e" />
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>No Send Albums</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
                            Albums you send to customers will appear here.
                        </Typography>
                    </Box>
                )}
            </Container>

            <FullPageLoader open={loading} message="Loading Send Albums..." />
        </GridBackground>
    );
};

export default AlbumSentListClient;
