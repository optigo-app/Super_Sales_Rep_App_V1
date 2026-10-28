"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Images, Plus, Pencil, Trash2, ImageUp, Eye,
    Lock, Globe2, CalendarDays, Layers, MoreVertical, Undo2,
    Globe, CheckSquare, Square, Send, ImagePlus, X as XIcon,
} from 'lucide-react';
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
    Chip,
    CircularProgress,
    Tooltip,
    Dialog,
    DialogContent,
    TextField,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
} from '@mui/material';

import { useToast } from '@mc/context/ToastContext';
import { assetPath } from '@mc/utils/paths';
import {
    callAlbumApi,
    getProAlbumListApi,
    proAlbumActionApi,
    proAlbumSentOnApi,
    proAlbumMoveToArchiveApi,
} from '@mc/app/api/albumApi';
import { uploadService } from '@mc/services/uploadService';
import GridBackground from '../Common/GridBackground';
import PageHeader from '../Common/PageHeader';
import ReusableConfirmModal from '../Common/modals/ReusableConfirmModal';
import SendAlbumDialog from './SendAlbumDialog';
import FullPageLoader from '../FullPageLoader';

const getAlbumImageSrc = (album, errored) => {
    if (errored || !album?.albumImageName) return assetPath('/images/image-not-found.jpg');
    const base = (album.frontenddomainpath || '').replace(/\/?$/, '/');
    return `${base}${album.albumImageName}`;
};

const AlbumListClient = () => {
    const router = useRouter();
    const { showSuccess, showError } = useToast();

    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState({});

    // Edit dialog (name + date → ProAlbum_Action mode=edit)
    const [editTarget, setEditTarget] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDate, setEditDate] = useState(dayjs());
    const [editBusy, setEditBusy] = useState(false);

    // Delete confirm — holds { album, hard } (hard = permanent delete from trash)
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Cover upload
    const uploadInputRef = useRef(null);
    const [uploadTarget, setUploadTarget] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);

    // Card "more" menu
    const [menuState, setMenuState] = useState(null); // { anchor, album }

    // Multi-select (web enable/disable)
    const [selectedIds, setSelectedIds] = useState([]);
    const [webBusy, setWebBusy] = useState(null); // 'enable' | 'disable'

    // Send album → customer dialog (catalog-share flow)
    const [sendTarget, setSendTarget] = useState(null);

    const fetchAlbums = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProAlbumListApi();
            setAlbums(data?.rd || []);
        } catch (err) {
            console.error('ProAlbum_List Error:', err);
            showError('Failed to load albums');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // Active albums first, trashed ones at the end
    const sortedAlbums = useMemo(
        () => [...albums].sort((a, b) => Number(a.IsDelete || 0) - Number(b.IsDelete || 0)),
        [albums]
    );

    // --- Navigation ---
    const handleAddNewAlbum = () => router.push('/magicCatalog/product');

    const handleAddMore = (album) => {
        sessionStorage.setItem('albumId', String(album.id));
        sessionStorage.setItem('albumName', album.albumName || '');
        router.push(`/magicCatalog/product?albumid=${album.id}`);
    };

    const handleViewAlbum = (album) => {
        router.push(`/magicCatalog/albums/view?id=${album.id}&name=${encodeURIComponent(album.albumName || '')}`);
    };

    // --- Edit dialog → ProAlbum_Action mode=edit ---
    const openEditDialog = (album) => {
        setEditTarget(album);
        setEditName(album.albumName || '');
        setEditDate(album.albumdate1 ? dayjs(album.albumdate1) : dayjs());
    };

    const handleEditSave = async () => {
        if (!editName.trim()) {
            showError('Please enter an album name');
            return;
        }
        setEditBusy(true);
        try {
            const res = await proAlbumActionApi({
                mode: 'edit',
                Article_AlbumMasterid: String(editTarget.id),
                Albumdate: editDate ? dayjs(editDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                AlbumName: editName.trim(),
            });
            const row = res?.rd?.[0] || {};
            const msg = row.MSG ?? row.Msg ?? row.message;
            if (msg && String(msg).toLowerCase() !== 'success') throw new Error(String(msg));
            showSuccess('Album updated');
            setEditTarget(null);
            fetchAlbums();
        } catch (err) {
            console.error('ProAlbum_Action edit Error:', err);
            showError(err?.message || 'Failed to update album');
        } finally {
            setEditBusy(false);
        }
    };

    // --- Delete: del (trash) / reactive (restore) / harddel (permanent) ---
    const runAlbumAction = async (p, successMsg) => {
        const res = await proAlbumActionApi(p);
        const row = res?.rd?.[0] || {};
        const msg = row.MSG ?? row.Msg ?? row.message;
        if (msg && String(msg).toLowerCase() !== 'success') throw new Error(String(msg));
        showSuccess(successMsg);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await runAlbumAction(
                { mode: deleteTarget.hard ? 'harddel' : 'del', Article_AlbumMasterid: String(deleteTarget.album.id) },
                deleteTarget.hard ? 'Album permanently deleted' : 'Album moved to trash'
            );
            // Hard delete also archives the album — second call
            if (deleteTarget.hard) {
                await proAlbumMoveToArchiveApi(deleteTarget.album.id);
            }
            setDeleteTarget(null);
            fetchAlbums();
        } catch (err) {
            console.error('ProAlbum_Action delete Error:', err);
            showError(err?.message || 'Failed to delete album');
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async (album) => {
        try {
            await runAlbumAction(
                { mode: 'reactive', Article_AlbumMasterid: String(album.id) },
                'Album restored'
            );
            fetchAlbums();
        } catch (err) {
            console.error('ProAlbum_Action reactive Error:', err);
            showError(err?.message || 'Failed to restore album');
        }
    };

    // --- Enable / disable on web (single + multi-select) ---
    const isOnWeb = (album) => Number(album.IsAPI) === 1;

    const runSentOnApi = async (ids, action) => {
        const res = await proAlbumSentOnApi(ids, action);
        const row = res?.rd?.[0] || {};
        const msg = row.MSG ?? row.Msg ?? row.message;
        if (msg && String(msg).toLowerCase() !== 'success') throw new Error(String(msg));
    };

    const handleWebToggle = async (album) => {
        const action = isOnWeb(album) ? 'disable_on_web' : 'enable_on_web';
        try {
            await runSentOnApi(album.id, action);
            showSuccess(action === 'enable_on_web' ? 'Album enabled on web' : 'Album disabled on web');
            fetchAlbums();
        } catch (err) {
            console.error('ProAlbum_SentOnAPI Error:', err);
            showError(err?.message || 'Failed to update web status');
        }
    };

    const toggleSelect = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleBulkWeb = async (action) => {
        if (!selectedIds.length || webBusy) return;
        setWebBusy(action === 'enable_on_web' ? 'enable' : 'disable');
        try {
            await runSentOnApi(selectedIds, action);
            showSuccess(
                action === 'enable_on_web'
                    ? `${selectedIds.length} album${selectedIds.length > 1 ? 's' : ''} enabled on web`
                    : `${selectedIds.length} album${selectedIds.length > 1 ? 's' : ''} disabled on web`
            );
            setSelectedIds([]);
            fetchAlbums();
        } catch (err) {
            console.error('ProAlbum_SentOnAPI bulk Error:', err);
            showError(err?.message || 'Failed to update web status');
        } finally {
            setWebBusy(null);
        }
    };

    // --- Cover image upload ---
    const handleUploadClick = (album) => {
        setUploadTarget(album);
        uploadInputRef.current?.click();
    };

    const handleUploadFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !uploadTarget) return;
        setUploadingId(uploadTarget.id);
        try {
            const uploaded = await uploadService.uploadFile(file, 'Album', '', `album_${uploadTarget.id}`);
            if (!uploaded) throw new Error('Upload failed');
            const fileName = typeof uploaded === 'string' ? uploaded.split('/').pop() : uploaded?.name;
            const res = await callAlbumApi(
                'ProAlbum_UpdateImage',
                JSON.stringify({ id: uploadTarget.id, albumImageName: fileName || uploaded }),
                'ProAlbum_UpdateImage'
            );
            const row = res?.rd?.[0] || {};
            const msg = row.MSG ?? row.Msg ?? row.message;
            if (msg && String(msg).toLowerCase() !== 'success') throw new Error(String(msg));
            showSuccess('Album image updated');
            fetchAlbums();
        } catch (err) {
            console.error('Album image upload error:', err);
            showError(err?.message || 'Failed to upload album image');
        } finally {
            setUploadingId(null);
            setUploadTarget(null);
        }
    };

    const actionBtnSx = {
        width: 30,
        height: 30,
        bgcolor: 'rgba(0,0,0,0.04)',
        '&:hover': { bgcolor: 'rgba(115,103,240,0.12)', color: 'primary.main' },
    };

    const menuAlbum = menuState?.album;

    return (
        <GridBackground>
            <Container maxWidth="false" sx={{ position: 'relative', zIndex: 2, pb: '110px', px: '0 !important' }}>
                <PageHeader
                    centerTitle="My Albums"
                    centerIcon={Images}
                    leftContent={
                        <IconButton onClick={() => router.push('/')} aria-label="Go back">
                            <ArrowLeft size={20} />
                        </IconButton>
                    }
                />

                <Grid container spacing={1.5} sx={{ p: '10px 16px !important', mt: 2, maxWidth: 1200, mx: 'auto' }}>
                    {/* Add New Album row → catalog page */}
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Card
                                onClick={handleAddNewAlbum}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.25,
                                    cursor: 'pointer',
                                    borderRadius: 2.5,
                                    border: '2px dashed rgba(115,103,240,0.35)',
                                    bgcolor: 'rgba(115,103,240,0.04)',
                                    boxShadow: 'none',
                                    color: 'primary.main',
                                    transition: 'all 0.25s ease',
                                    '&:hover': { bgcolor: 'rgba(115,103,240,0.08)', borderColor: 'rgba(115,103,240,0.6)' },
                                    '&:active': { transform: 'scale(0.98)' },
                                }}
                            >
                                <Box sx={{
                                    width: 64, height: 64, borderRadius: 2, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: 'rgba(115,103,240,0.10)',
                                }}>
                                    <Plus size={28} strokeWidth={2.2} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">Add New Album</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                                        Pick designs from the catalog
                                    </Typography>
                                </Box>
                            </Card>
                        </motion.div>
                    </Grid>

                    {/* Album rows — full box view, mobile-friendly action row */}
                    {sortedAlbums.map((album, index) => {
                        const trashed = Number(album.IsDelete) === 1;
                        const onWeb = isOnWeb(album);
                        const selected = selectedIds.includes(album.id);
                        const cardActionSx = {
                            flex: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderRadius: 2,
                            color: 'text.secondary',
                            py: 0.75,
                            gap: 0.5,
                            '&:hover': { bgcolor: 'rgba(115,103,240,0.08)', color: 'primary.main' },
                        };
                        return (
                            <Grid key={album.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: Math.min((index + 1) * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Card
                                        sx={{
                                            borderRadius: 2.5,
                                            overflow: 'hidden',
                                            opacity: trashed ? 0.7 : 1,
                                            border: selected ? '1.5px solid rgba(115,103,240,0.6)' : '1.5px solid transparent',
                                            bgcolor: selected ? 'rgba(115,103,240,0.05)' : 'background.paper',
                                            transition: 'box-shadow 0.3s ease',
                                            '&:hover': { boxShadow: '0 10px 24px rgba(0,0,0,0.10)' },
                                        }}
                                    >
                                        {/* Top row — thumb + details + menu */}
                                        <Box
                                            onClick={() => !trashed && handleViewAlbum(album)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.25,
                                                p: 1.25,
                                                cursor: trashed ? 'default' : 'pointer',
                                            }}
                                        >
                                            {!trashed && (
                                                <Checkbox
                                                    size="small"
                                                    checked={selected}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => toggleSelect(album.id)}
                                                    icon={<Square size={16} />}
                                                    checkedIcon={<CheckSquare size={16} />}
                                                    sx={{ p: 0.25, ml: -0.5, color: 'rgba(0,0,0,0.25)', '&.Mui-checked': { color: 'primary.main' } }}
                                                />
                                            )}

                                            <Box sx={{
                                                width: 56, height: 56, borderRadius: 2,
                                                overflow: 'hidden', bgcolor: 'grey.100',
                                                flexShrink: 0, position: 'relative',
                                            }}>
                                                <CardMedia
                                                    component="img"
                                                    image={getAlbumImageSrc(album, imageErrors[album.id])}
                                                    alt={album.albumName}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={() => setImageErrors(prev => ({ ...prev, [album.id]: true }))}
                                                />
                                                {uploadingId === album.id && (
                                                    <Box sx={{
                                                        position: 'absolute', inset: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        bgcolor: 'rgba(255,255,255,0.7)',
                                                    }}>
                                                        <CircularProgress size={20} />
                                                    </Box>
                                                )}
                                            </Box>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    fontWeight={700}
                                                    fontSize="0.92rem"
                                                    title={album.albumName}
                                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                >
                                                    {album.albumName}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 0.3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
                                                        <CalendarDays size={11} />
                                                        <Typography sx={{ fontSize: '0.68rem' }}>{album.albumdate}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'primary.main' }}>
                                                        <Layers size={11} />
                                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                            {album.cnt ?? 0} items
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        icon={album.AlbumSecurity === 'Public' ? <Globe2 size={10} /> : <Lock size={10} />}
                                                        label={album.AlbumSecurity || 'Public'}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.58rem',
                                                            fontWeight: 600,
                                                            bgcolor: album.AlbumSecurity === 'Public' ? 'rgba(15,157,119,0.10)' : 'rgba(232,131,12,0.10)',
                                                            color: album.AlbumSecurity === 'Public' ? '#0f9d77' : '#e8830c',
                                                            '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                        }}
                                                    />
                                                    {onWeb && (
                                                        <Chip
                                                            icon={<Globe size={10} />}
                                                            label="On Web"
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '0.58rem',
                                                                fontWeight: 700,
                                                                bgcolor: 'rgba(115,103,240,0.12)',
                                                                color: 'primary.main',
                                                                '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                            }}
                                                        />
                                                    )}
                                                    {trashed && (
                                                        <Chip
                                                            icon={<Trash2 size={10} />}
                                                            label="In Trash"
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '0.58rem',
                                                                fontWeight: 700,
                                                                bgcolor: 'rgba(244,67,54,0.10)',
                                                                color: 'error.main',
                                                                '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            {!trashed && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); setMenuState({ anchor: e.currentTarget, album }); }}
                                                    sx={{ ...actionBtnSx, alignSelf: 'flex-start' }}
                                                    aria-label="More actions"
                                                >
                                                    <MoreVertical size={15} />
                                                </IconButton>
                                            )}
                                        </Box>

                                        {/* Bottom action row — labeled buttons, big tap targets */}
                                        <Box sx={{
                                            display: 'flex',
                                            borderTop: '1px solid rgba(0,0,0,0.06)',
                                            px: 0.5,
                                            py: 1,
                                        }}>
                                            {trashed ? (
                                                <>
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleRestore(album)}
                                                        startIcon={<Undo2 size={14} />}
                                                        sx={{ ...cardActionSx, color: '#0f9d77', '&:hover': { bgcolor: 'rgba(15,157,119,0.08)', color: '#0f9d77' } }}
                                                    >
                                                        Restore
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => setDeleteTarget({ album, hard: true })}
                                                        startIcon={<Trash2 size={14} />}
                                                        sx={{ ...cardActionSx, color: 'error.main', '&:hover': { bgcolor: 'rgba(244,67,54,0.08)', color: 'error.main' } }}
                                                    >
                                                        Delete Forever
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleViewAlbum(album)}
                                                        startIcon={<Eye size={14} />}
                                                        sx={cardActionSx}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => openEditDialog(album)}
                                                        startIcon={<Pencil size={14} />}
                                                        sx={cardActionSx}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => setSendTarget(album)}
                                                        startIcon={<Send size={14} />}
                                                        sx={cardActionSx}
                                                    >
                                                        Send
                                                    </Button>
                                                </>
                                            )}
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Empty state */}
                {!loading && albums.length === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 4, textAlign: 'center' }}>
                        <Box sx={{
                            width: 110, height: 110, borderRadius: '50%', bgcolor: 'grey.100',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                        }}>
                            <Images size={52} color="#9e9e9e" />
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>No albums yet</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
                            Create your first album to organize designs, stock and articles.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Plus size={16} />}
                            onClick={handleAddNewAlbum}
                            sx={{
                                textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3,
                                background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                            }}
                        >
                            Add New Album
                        </Button>
                    </Box>
                )}

                {/* Hidden file input for cover upload */}
                <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleUploadFile}
                />
            </Container>

            {/* Card overflow menu — upload cover / web toggle / delete */}
            <Menu
                open={Boolean(menuState)}
                anchorEl={menuState?.anchor}
                onClose={() => setMenuState(null)}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        minWidth: 180,
                        py: 0.5,
                    }
                }}
            >
                <MenuItem
                    onClick={() => { const a = menuAlbum; setMenuState(null); if (a) handleAddMore(a); }}
                    sx={{ px: 1.5, py: 1, mx: 0.5, borderRadius: 1.5, gap: 1 }}
                >
                    <ListItemIcon sx={{ minWidth: '0 !important' }}><ImagePlus size={16} /></ListItemIcon>
                    <ListItemText primary="Add more designs" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem
                    onClick={() => { const a = menuAlbum; setMenuState(null); if (a) handleUploadClick(a); }}
                    sx={{ px: 1.5, py: 1, mx: 0.5, borderRadius: 1.5, gap: 1 }}
                >
                    <ListItemIcon sx={{ minWidth: '0 !important' }}><ImageUp size={16} /></ListItemIcon>
                    <ListItemText primary="Upload cover" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem
                    onClick={() => { const a = menuAlbum; setMenuState(null); if (a) handleWebToggle(a); }}
                    sx={{ px: 1.5, py: 1, mx: 0.5, borderRadius: 1.5, gap: 1 }}
                >
                    <ListItemIcon sx={{ minWidth: '0 !important' }}><Globe size={16} /></ListItemIcon>
                    <ListItemText
                        primary={menuAlbum && isOnWeb(menuAlbum) ? 'Disable on web' : 'Enable on web'}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                    />
                </MenuItem>
                <MenuItem
                    onClick={() => { const a = menuAlbum; setMenuState(null); if (a) setDeleteTarget({ album: a, hard: false }); }}
                    sx={{ px: 1.5, py: 1, mx: 0.5, borderRadius: 1.5, gap: 1, color: 'error.main' }}
                >
                    <ListItemIcon sx={{ minWidth: '0 !important', color: 'inherit' }}><Trash2 size={16} /></ListItemIcon>
                    <ListItemText primary="Move to trash" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                </MenuItem>
            </Menu>

            {/* Edit dialog — name + date → ProAlbum_Action mode=edit */}
            <Dialog
                open={Boolean(editTarget)}
                onClose={() => !editBusy && setEditTarget(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, m: 2 } }}
            >
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        }}>
                            <Pencil size={16} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                            Edit Album
                        </Typography>
                    </Box>
                </Box>
                <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 0 }}>
                    <TextField
                        fullWidth
                        label="Album Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter album name"
                        size="small"
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Album Date"
                            value={editDate}
                            onChange={(newValue) => setEditDate(newValue)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { fullWidth: true, size: 'small', InputLabelProps: { shrink: true } } }}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <Box sx={{ display: 'flex', gap: 1, px: 2.5, pt: 2.5, pb: 2.5 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setEditTarget(null)}
                        disabled={editBusy}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEditSave}
                        disabled={editBusy}
                        startIcon={editBusy ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : null}
                        sx={{
                            flex: 1, textTransform: 'none', borderRadius: 2, fontWeight: 600,
                            background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                            boxShadow: 'none',
                            '&:hover': { background: 'linear-gradient(135deg, #5f5bd6 0%, #514ec9 100%)', boxShadow: 'none' },
                        }}
                    >
                        {editBusy ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            </Dialog>

            {/* Bottom bar — multi-select web actions */}
            {selectedIds.length > 0 && (
                <Box sx={{
                    position: 'fixed',
                    bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', md: 24 },
                    left: 0, right: 0, px: 2, zIndex: 1000,
                    pointerEvents: 'none', display: 'flex', justifyContent: 'center',
                }}>
                    <Box sx={{
                        pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '30px', border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)', p: '6px',
                    }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleBulkWeb('enable_on_web')}
                            disabled={Boolean(webBusy)}
                            startIcon={webBusy === 'enable' ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Globe size={15} />}
                            sx={{
                                textTransform: 'none', fontWeight: 600, borderRadius: '24px',
                                px: 1.5, fontSize: '0.78rem', boxShadow: 'none',
                                background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                            }}
                        >
                            Enable web ({selectedIds.length})
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleBulkWeb('disable_on_web')}
                            disabled={Boolean(webBusy)}
                            startIcon={webBusy === 'disable' ? <CircularProgress size={14} /> : <XIcon size={15} />}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '24px', px: 1.5, fontSize: '0.78rem' }}
                        >
                            Disable web
                        </Button>
                        <IconButton size="small" onClick={() => setSelectedIds([])} sx={{ width: 30, height: 30 }}>
                            <XIcon size={15} />
                        </IconButton>
                    </Box>
                </Box>
            )}

            {/* Send album — catalog-share flow (new / existing customer) */}
            <SendAlbumDialog
                open={Boolean(sendTarget)}
                onClose={() => setSendTarget(null)}
                album={sendTarget}
            />

            <ReusableConfirmModal
                open={Boolean(deleteTarget)}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                type={deleteTarget?.hard ? 'hardDeleteAlbum' : 'deleteAlbum'}
            />

            <FullPageLoader open={loading} message="Loading albums..." />
        </GridBackground>
    );
};

export default AlbumListClient;