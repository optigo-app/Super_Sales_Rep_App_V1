'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const SalesChart = dynamic(() => import('@/components/SalesChart'), { ssr: false, loading: () => null });

const statusStyle = {
  completed: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  pending:   { bg: 'rgba(249,115,22,0.12)', color: '#F97316' },
  processed: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
};

function fmtAmt(n) {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

const CHART_TABS = ['Weekly', 'Monthly', 'Yearly'];

export default function SaleOverviewPage() {
  const router = useRouter();

  const [chartTab,    setChartTab]    = useState('Weekly');
  const [reportTab,   setReportTab]   = useState('Sales Report');
  const [search,      setSearch]      = useState('');
  const [dashData,    setDashData]    = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dashboardData');
      if (raw) setDashData(JSON.parse(raw));
    } catch (e) {
      console.error('dashboardData parse error', e);
    }
  }, []);

  // ── Chart data per tab ─────────────────────────────────────────────────────
  const chartData = (() => {
    if (!dashData?.chart) return [];
    if (chartTab === 'Weekly')  return (dashData.chart.rd1 || []).map(d => ({ date: d.Day_Name,   Sales: d.SaleAmount }));
    if (chartTab === 'Monthly') return (dashData.chart.rd2 || []).map(d => ({ date: d.Month_Name, Sales: d.SaleAmount }));
    if (chartTab === 'Yearly')  return [{ date: 'FY Total', Sales: dashData.chart.rd3?.[0]?.SaleAmount ?? 0 }];
    return [];
  })();

  // ── Summary ────────────────────────────────────────────────────────────────
  // Use current week (rd) for summary cards — today's running totals
  const weekRows     = dashData?.chart?.rd  || [];
  const totalSales   = weekRows.reduce((s, r) => s + (r.SaleAmount   || 0), 0);
  const totalPurchase= weekRows.reduce((s, r) => s + (r.PurchaseAmount|| 0), 0);

  // ── Sales Report (category list) ──────────────────────────────────────────
  const categoryList = dashData?.category || [];
  const filtered     = categoryList.filter(r =>
    r.Category.toLowerCase().includes(search.toLowerCase()) ||
    r.SrNo.toString().includes(search)
  );

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
      <Box sx={{ px: 2, pt: 1.5, pb: '80px' }}>

        {/* Back + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box onClick={() => router.back()} sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(124,58,237,0.1)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', '&:active': { transform: 'scale(0.9)' }, transition: 'transform 0.15s' }}>
            <ArrowLeft size={18} color="#1F2937" />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Sale Overview</Typography>
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 2, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <TrendingUp size={18} color="#10B981" strokeWidth={2.2} />
            </Box>
            <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.25 }}>Total Sales (This Week)</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{fmtAmt(totalSales)}</Typography>
          </Box>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 2, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <TrendingDown size={18} color="#7C3AED" strokeWidth={2.2} />
            </Box>
            <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.25 }}>Total Purchase (This Week)</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#7C3AED' }}>{fmtAmt(totalPurchase)}</Typography>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 2, mb: 2.5, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
          {/* Chart Tab Pills */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>Sales Trend</Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {CHART_TABS.map(t => (
                <Box key={t} onClick={() => setChartTab(t)}
                  sx={{ px: 1.5, py: 0.4, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
                    bgcolor: chartTab === t ? '#7C3AED' : '#EDE9FE',
                    color:   chartTab === t ? '#fff'    : '#7C3AED',
                  }}>
                  {t}
                </Box>
              ))}
            </Box>
          </Box>
          <SalesChart data={chartData} />
        </Box>

        {/* Sales Report */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
            {['Sales Report'].map((t) => (
              <Box key={t} onClick={() => { setReportTab(t); setSearch(''); }}
                sx={{ flex: 1, textAlign: 'center', py: 1.5, fontSize: 14, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', color: reportTab === t ? '#7C3AED' : '#6B7280', borderBottom: reportTab === t ? '2px solid #7C3AED' : '2px solid transparent', transition: 'all 0.15s' }}>
                {t}
              </Box>
            ))}
          </Box>

          <Box sx={{ p: 2 }}>
            {/* Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'white', borderRadius: 10, px: 2, py: 1.1, mb: 2, border: '1px solid #EDE9FE' }}>
              <Search size={16} color="#9CA3AF" />
              <Box component="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search category..."
                sx={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1F2937', bgcolor: 'transparent', '&::placeholder': { color: '#9CA3AF' } }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filtered.map((r) => (
                <Box key={r.SrNo} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'white', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', '&:active': { bgcolor: '#EDE9FE' }, transition: 'background 0.15s' }}>
                  {/* Avatar */}
                  <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>#{r.SrNo}</Typography>
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.Category.replace(/_/g, ' ')}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                      {r.SaleJobCount} pcs · GW {r.SaleGrossWt}g · NW {r.SaleNetWt}g
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937', mb: 0.3 }}>
                      {fmtAmt(r.SaleAmount)}
                    </Typography>
                    {r.SaleRetunAmount > 0 && (
                      <Chip label={`-${fmtAmt(r.SaleRetunAmount)}`} size="small"
                        sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600, fontSize: 10, height: 18, '& .MuiChip-label': { px: 0.8 } }} />
                    )}
                  </Box>
                </Box>
              ))}

              {filtered.length === 0 && (
                <Typography sx={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, py: 3 }}>No results found</Typography>
              )}
            </Box>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}