'use client';

import { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Search, SlidersHorizontal, LayoutGrid, List, QrCode } from 'lucide-react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';

const categories = ['All', 'Gold', 'Diamond', 'Silver', 'Gems'];

const products = [
  { id: '1', name: 'Gold Necklace Set',  code: 'GN-001', weight: '25g', price: 'Amt 45,000',  category: 'Gold',    bg: '#FEF9C3', inStock: true  },
  { id: '2', name: 'Diamond Ring',        code: 'DR-002', weight: '5g',  price: 'Amt 85,000',  category: 'Diamond', bg: '#EDE9FE', inStock: true  },
  { id: '3', name: 'Silver Bracelet',     code: 'SB-003', weight: '15g', price: 'Amt 12,000',  category: 'Silver',  bg: '#F1F5F9', inStock: false },
  { id: '4', name: 'Gold Earrings',       code: 'GE-004', weight: '8g',  price: 'Amt 28,000',  category: 'Gold',    bg: '#FEF9C3', inStock: true  },
  { id: '5', name: 'Gemstone Pendant',    code: 'GP-005', weight: '6g',  price: 'Amt 32,000',  category: 'Gems',    bg: '#FCE7F3', inStock: true  },
  { id: '6', name: 'Diamond Bracelet',    code: 'DB-006', weight: '12g', price: 'Amt 1,20,000', category: 'Diamond', bg: '#EDE9FE', inStock: true  },
];

function JewelryPlaceholder({ bg }) {
  return (
    <Box sx={{ width: '100%', aspectRatio: '1', bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
      💍
    </Box>
  );
}

export default function CollectionPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [view,     setView]     = useState('grid');
  const [selected, setSelected] = useState(new Set());

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
      <Header />

      <Box sx={{ px: 2, pt: 2, pb: '80px' }}>
        {/* Title + View Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1F2937' }}>Collection</Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {[{ type: 'grid', icon: LayoutGrid }, { type: 'list', icon: List }].map(({ type, icon: Icon }) => (
              <Box
                key={type}
                onClick={() => setView(type)}
                sx={{
                  width: 36, height: 36, borderRadius: 1.5,
                  bgcolor: view === type ? '#7C3AED' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 1px 4px rgba(124,58,237,0.1)',
                  WebkitTapHighlightColor: 'transparent',
                  '&:active': { transform: 'scale(0.9)' }, transition: 'all 0.15s',
                }}
              >
                <Icon size={16} color={view === type ? '#fff' : '#7C3AED'} strokeWidth={2.2} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Search + Filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', borderRadius: 10, px: 2, py: 1.25, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.1)' }}>
            <Search size={17} color="#9CA3AF" />
            <Box component="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
              sx={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1F2937', bgcolor: 'transparent', '&::placeholder': { color: '#9CA3AF' } }}
            />
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(124,58,237,0.3)', WebkitTapHighlightColor: 'transparent', '&:active': { transform: 'scale(0.9)' }, transition: 'transform 0.15s' }}>
            <SlidersHorizontal size={17} color="#fff" strokeWidth={2.2} />
          </Box>
        </Box>

        {/* Category Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {categories.map((cat) => (
            <Box key={cat} onClick={() => setCategory(cat)}
              sx={{ px: 2, py: 0.75, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s ease', '&:active': { transform: 'scale(0.95)' }, bgcolor: category === cat ? '#7C3AED' : '#fff', color: category === cat ? '#fff' : '#6B7280', border: category === cat ? '1.5px solid #7C3AED' : '1.5px solid #EDE9FE' }}
            >
              {cat}
            </Box>
          ))}
        </Box>

        {/* Product Grid / List */}
        {view === 'grid' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {filtered.map((p) => (
              <Box key={p.id} sx={{ bgcolor: '#fff', borderRadius: "10px", overflow: 'hidden', boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.15s ease', '&:active': { transform: 'scale(0.97)' }, position: 'relative' }}>
                <Box onClick={(e) => { e.stopPropagation(); toggleSelect(p.id); }}
                  sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2, width: 20, height: 20, borderRadius: '5px', border: selected.has(p.id) ? '2px solid #7C3AED' : '2px solid #CBD5E1', bgcolor: selected.has(p.id) ? '#7C3AED' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {selected.has(p.id) && <Box component="span" sx={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</Box>}
                </Box>
                {!p.inStock && <Chip label="Out" size="small" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, bgcolor: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 10, height: 20, '& .MuiChip-label': { px: 0.8 } }} />}
                <JewelryPlaceholder bg={p.bg} />
                <Box sx={{ p: 1.25 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937', mb: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#6B7280', mb: 0.4 }}>{p.code} · {p.weight}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{p.price}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filtered.map((p) => (
              <Box key={p.id} sx={{ bgcolor: '#fff', borderRadius: "10px", p: 1.5, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)', display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', '&:active': { transform: 'scale(0.98)', bgcolor: 'white' }, transition: 'all 0.15s', position: 'relative' }}>
                <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💍</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.3 }}>{p.code} · {p.weight}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{p.price}</Typography>
                </Box>
                {!p.inStock && <Chip label="Out" size="small" sx={{ bgcolor: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 10, height: 20, '& .MuiChip-label': { px: 0.8 } }} />}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* QR FAB */}
      <Box sx={{ position: 'fixed', right: 'max(20px, calc(50% - 220px))', bottom: 76, width: 52, height: 52, borderRadius: '50%', bgcolor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(13,148,136,0.4)', cursor: 'pointer', zIndex: 400, WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease', '&:active': { transform: 'scale(0.9)', boxShadow: '0 2px 10px rgba(13,148,136,0.3)' } }}>
        <QrCode size={22} color="#fff" strokeWidth={2} />
      </Box>

      <BottomNav />
    </Box>
  );
}
