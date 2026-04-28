'use client';

import { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const SalesChart = dynamic(() => import('@/components/SalesChart'), { ssr: false, loading: () => null });

const salesData = [
  { date: '18 Apr', Sales: 45000, Returns: 1200 },
  { date: '19 Apr', Sales: 52000, Returns: 800  },
  { date: '20 Apr', Sales: 48000, Returns: 2000 },
  { date: '21 Apr', Sales: 61000, Returns: 500  },
  { date: '22 Apr', Sales: 72000, Returns: 1500 },
];

const salesReport = [
  { num: '001', name: 'Rajesh Kumar', items: '5 items', date: '22 Apr', amount: '₹15,000', status: 'completed' },
  { num: '002', name: 'Priya Shah',   items: '8 items', date: '22 Apr', amount: '₹25,000', status: 'completed' },
  { num: '003', name: 'Amit Patel',   items: '3 items', date: '22 Apr', amount: '₹12,000', status: 'pending'   },
  { num: '004', name: 'Suresh Mehta', items: '6 items', date: '21 Apr', amount: '₹18,000', status: 'completed' },
  { num: '005', name: 'Neha Gupta',   items: '2 items', date: '21 Apr', amount: '₹8,500',  status: 'pending'   },
];

const returnReport = [
  { num: 'R01', name: 'Rajesh Kumar', items: '1 item',  date: '22 Apr', amount: '₹4,500', status: 'processed' },
  { num: 'R02', name: 'Priya Shah',   items: '2 items', date: '20 Apr', amount: '₹3,500', status: 'pending'   },
];

const statusStyle = {
  completed: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  pending:   { bg: 'rgba(249,115,22,0.12)', color: '#F97316' },
  processed: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
};

export default function SaleOverviewPage() {
  const router = useRouter();
  const [tab,    setTab]    = useState('Sales Report');
  const [search, setSearch] = useState('');

  const list     = tab === 'Sales Report' ? salesReport : returnReport;
  const filtered = list.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.num.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box sx={{ bgcolor: '#F5F3FF', minHeight: '100vh' }}>
      <Header
        rightContent={
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>E</Box>
        }
      />

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
            <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.25 }}>Total Sales</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>₹52,000</Typography>
          </Box>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 2, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <TrendingDown size={18} color="#EF4444" strokeWidth={2.2} />
            </Box>
            <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.25 }}>Returns</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>₹8,000</Typography>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 2, mb: 2.5, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', mb: 2 }}>Sales Trend (Last 5 Days)</Typography>
          <SalesChart data={salesData} />
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
            {['Sales Report', 'Sale Returns'].map((t) => (
              <Box key={t} onClick={() => { setTab(t); setSearch(''); }}
                sx={{ flex: 1, textAlign: 'center', py: 1.5, fontSize: 14, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', color: tab === t ? '#7C3AED' : '#6B7280', borderBottom: tab === t ? '2px solid #7C3AED' : '2px solid transparent', transition: 'all 0.15s' }}>
                {t}
              </Box>
            ))}
          </Box>

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F5F3FF', borderRadius: 10, px: 2, py: 1.1, mb: 2, border: '1px solid #EDE9FE' }}>
              <Search size={16} color="#9CA3AF" />
              <Box component="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                sx={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1F2937', bgcolor: 'transparent', '&::placeholder': { color: '#9CA3AF' } }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filtered.map((r) => {
                const ss = statusStyle[r.status] ?? statusStyle.pending;
                return (
                  <Box key={r.num} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: '#F5F3FF', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', '&:active': { bgcolor: '#EDE9FE' }, transition: 'background 0.15s' }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>{r.num}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#6B7280' }}>{r.items} · {r.date}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937', mb: 0.3 }}>{r.amount}</Typography>
                      <Chip label={r.status} size="small" sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 600, fontSize: 10, height: 18, '& .MuiChip-label': { px: 0.8 } }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      <BottomNav />
    </Box>
  );
}
