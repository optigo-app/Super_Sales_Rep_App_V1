'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import { TrendingUp, Package } from 'lucide-react';
import { CRMCustomerLog } from '@/Utils/API/CRMCustomerLog/CRMCustomerLog';

export default function ReportsTab({ customerId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [designData, setDesignData] = useState([]);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    CRMCustomerLog('CRM_Customer_DesignWiseSale', customerId)
      .then((response) => {
        if (response.Status === '200' && response.Data?.rd) {
          setDesignData(response.Data.rd);
        }
      })
      .catch((err) => console.error('API Error:', err))
      .finally(() => setIsLoading(false));
  }, [customerId]);

  const handleImgError = (index, defImage) => {
    setImgErrors((prev) => ({ ...prev, [index]: defImage }));
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  // ── Empty ────────────────────────────────────────────────────
  if (designData.length === 0) {
    return (
      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={26} color="#7C3AED" />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>No Data Available</Typography>
        <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>No design wise sale records found.</Typography>
      </Box>
    );
  }

  // ── Data ─────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={16} color="#7C3AED" />
        </Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>
          Design Wise Sale
        </Typography>
        <Chip
          label={`${designData.length} designs`}
          size="small"
          sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: 11, height: 22, '& .MuiChip-label': { px: 1 } }}
        />
      </Box>

      {/* Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {designData.map((design, index) => (
          <Box
            key={index}
            sx={{
              bgcolor: '#fff',
              borderRadius: 2.5,
              overflow: 'hidden',
              boxShadow: '0 1px 6px rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.08)',
              transition: 'all 0.15s',
              '&:active': { transform: 'scale(0.97)' },
            }}
          >
            {/* Image */}
            <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: '#F5F3FF' }}>
              <Box
                component="img"
                src={imgErrors[index] || design.ImagePath}
                alt={`Design ${design.DesignNo}`}
                onError={() => handleImgError(index, design.DefImage)}
                sx={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>

            {/* Info */}
            <Box sx={{ p: 1.25 }}>
              {/* Design No + Purchase Count */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                  {design.DesignNo || '—'}
                </Typography>
                <Chip
                  label={`×${design.SalesCnt ?? 0}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, fontSize: 10, height: 20, '& .MuiChip-label': { px: 0.8 } }}
                />
              </Box>

              {/* Net Wt + Dia Wt */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Box>
                  <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Wt</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{design.DesignNetWt ?? '—'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dia Wt</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{design.DiamondWt ?? '—'}</Typography>
                </Box>
              </Box>

              <Box sx={{ pt: 0.5, borderTop: '1px solid #F3F4F6' }}>
                <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>CS Wt</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{design.ColorstoneWt ?? '—'}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}