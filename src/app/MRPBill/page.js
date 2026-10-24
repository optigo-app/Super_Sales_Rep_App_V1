'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Button, Dialog, DialogContent, DialogActions } from '@mui/material';
import { ScanLine, Trash2, Settings2 } from 'lucide-react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import { CommonAPImainScan } from '@/Utils/API/CommonAPImain/CommonAPImainScan';
import LoadingBackdrop from '@/Utils/LoadingBackdrop';
import { showToast } from '@/components/Toast/ToastContainer';

const LOCKERS = ['Head Office', 'Branch 1', 'Branch 2', 'Vault A'];
const CURRENCIES = ['INR Amt', 'USD $', 'AED د.إ', 'GBP £'];
const BOOKS = ['Sale', 'Purchase', 'Exchange'];

function Field({ label, children }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#6B7280', mb: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  );
}

const inp = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #EDE9FE', borderRadius: '8px',
  fontSize: 13, color: '#1F2937', outline: 'none',
  background: '#fff', fontFamily: 'inherit',
};

const sel = { ...inp, appearance: 'none', cursor: 'pointer' };

export default function MRPBillPage() {
  const [custName, setCustName] = useState('');
  const [locker, setLocker] = useState('Head Office');
  const [currency, setCurrency] = useState('INR Amt');
  const [books, setBooks] = useState('Sale');
  const [endDate, setEndDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [jobInput, setJobInput] = useState('');
  const [products, setProducts] = useState([]);
  const [roundMode, setRoundMode] = useState('up');
  const [addLess, setAddLess] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [custOpen, setCustOpen] = useState(false);
  const [custDraft, setCustDraft] = useState([]);
  const [custTarget, setCustTarget] = useState(null); // null = all, id = single
  const [custMode, setCustMode] = useState('percent'); // 'percent' | 'amount'
  const [custValue, setCustValue] = useState('');

  const topDetailsFilled = custName.trim() && endDate;

  const fetchProduct = useCallback(async (jobNo) => {
    if (!jobNo.trim()) return;
    const already = products.some(p => p.jobNo === jobNo.trim());
    if (already) {
      showToast({ message: `${jobNo} already added`, bgColor: '#f1c40f', fontColor: '#000', duration: 2000 });
      return;
    }
    setIsLoading(true);
    try {
      const res = await CommonAPImainScan('TagInfo', jobNo.trim());
      const d = res?.Data?.rd?.[0];
      if (!d) { showToast({ message: 'Invalid job', bgColor: '#f13f3f', fontColor: '#fff', duration: 2500 }); return; }
      const item = {
        id: Date.now(),
        jobNo: d.JobNo,
        desc: `${d.DesignNo} — ${d.Category}`,
        amount: d.Amount || 0,
        salePrice: d.AmountWithtax || 0,
        customSale: d.AmountWithtax || 0,
        image: d?.CDNDesignImageFol + d?.ImageName || '',
        checked: true,
      };
      setProducts(prev => [item, ...prev]);
      showToast({ message: 'Product added', bgColor: '#27ae60', fontColor: '#fff', duration: 2000 });
    } catch {
      showToast({ message: 'Error fetching product', bgColor: '#f13f3f', fontColor: '#fff', duration: 2500 });
    } finally {
      setIsLoading(false);
      setJobInput('');
    }
  }, [products]);

  const removeProduct = (id) => setProducts(prev => prev.filter(p => p.id !== id));
  const toggleCheck = (id) => setProducts(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  const updateField = (id, key, val) => setProducts(prev => prev.map(p => p.id === id ? { ...p, [key]: parseFloat(val) || 0 } : p));

  const checked = products.filter(p => p.checked);
  const total = checked.reduce((s, p) => s + (p.customSale || 0), 0);
  const roundoff = roundMode === 'up' ? Math.ceil(total) - total : roundMode === 'less' ? -(total - Math.floor(total)) : 0;
  const addLessVal = roundMode === 'add' || roundMode === 'less' ? parseFloat(addLess) || 0 : 0;
  const finalAmt = Math.round(total + roundoff + addLessVal);
  const fmt = (n) => 'Amt' + Math.round(n).toLocaleString('en-IN');

  const openCustomize = (targetId = null) => {
    setCustTarget(targetId);
    setCustMode('percent');
    setCustValue('');
    setCustOpen(true);
  };

  const saveCustomize = () => {
    setProducts(custDraft);
    setCustOpen(false);
  };

  const applyCustomize = () => {
    const val = parseFloat(custValue) || 0;
    setProducts(prev => prev.map(p => {
      // If targeting single product, only apply to that one
      if (custTarget !== null && p.id !== custTarget) return p;
      // Only apply to checked products (for "All")
      if (custTarget === null && !p.checked) return p;

      let newSale;
      if (custMode === 'percent') {
        newSale = p.salePrice + (p.salePrice * val / 100);
      } else {
        newSale = p.salePrice + val;
      }
      return { ...p, customSale: Math.round(newSale * 100) / 100 };
    }));
    setCustOpen(false);
  };

  const RoBtn = ({ mode, label }) => (
    <Box onClick={() => setRoundMode(mode)} sx={{
      flex: 1, py: 1, textAlign: 'center', borderRadius: 2, cursor: 'pointer', fontSize: 13, fontWeight: 500,
      border: '1.5px solid', borderColor: roundMode === mode ? '#7C3AED' : '#EDE9FE',
      bgcolor: roundMode === mode ? '#7C3AED' : '#fff',
      color: roundMode === mode ? '#fff' : '#6B7280',
      transition: 'all .15s',
    }}>{label}</Box>
  );

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
      <LoadingBackdrop isLoading={isLoading} />
      <Box sx={{ px: 1.5, pt: 1.5, pb: '90px' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#1F2937', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
              MRP Bill
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.3 }}>
              Create or manage bills
            </Typography>
          </Box>
        </Box>
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '0.5px solid #EDE9FE', p: 1.75, mb: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.25 }}>
            <Field label="Customer name">
              <input style={inp} value={custName} onChange={e => setCustName(e.target.value)} placeholder="e.g. Robert Downey Jr" />
            </Field>
            <Field label="Locker">
              <select style={sel} value={locker} onChange={e => setLocker(e.target.value)}>
                {LOCKERS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.25 }}>
            <Field label="Currency">
              <select style={sel} value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Books">
              <select style={sel} value={books} onChange={e => setBooks(e.target.value)}>
                {BOOKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
          </Box>
          <Field label="Book end date">
            <input type="date" style={inp} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
        </Box>

        {/* Scan Section */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '0.5px solid #EDE9FE', p: 1.75, mb: 1.5 }}>

          {/* Scan tap area */}
          <Box onClick={() => topDetailsFilled && fetchProduct('DEMO-' + Date.now())} sx={{
            border: '2px dashed #EDE9FE', borderRadius: 2, py: 2.5, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 1, bgcolor: 'white', mb: 1.5,
            cursor: topDetailsFilled ? 'pointer' : 'not-allowed',
            opacity: topDetailsFilled ? 1 : 0.5,
            pointerEvents: topDetailsFilled ? 'auto' : 'none',
            '&:active': { borderColor: topDetailsFilled ? '#7C3AED' : '#EDE9FE' }, transition: 'border-color .2s, opacity .2s',
          }}>
            <Box sx={{ width: 44, height: 44, bgcolor: '#EDE9FE', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={22} color="#7C3AED" />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#7C3AED' }}>Tap to scan product</Typography>
            <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>or enter job number below</Typography>
          </Box>

          {/* Manual entry */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, opacity: topDetailsFilled ? 1 : 0.5 }}>
            <input
              style={{ ...inp, flex: 1, cursor: topDetailsFilled ? 'text' : 'not-allowed' }}
              value={jobInput}
              onChange={e => setJobInput(e.target.value)}
              onKeyDown={e => topDetailsFilled && e.key === 'Enter' && fetchProduct(jobInput)}
              placeholder={topDetailsFilled ? 'Enter job number' : 'Fill top details first'}
              disabled={!topDetailsFilled}
            />
            <Button
              onClick={() => topDetailsFilled && fetchProduct(jobInput)}
              disabled={!topDetailsFilled || !jobInput.trim()}
              sx={{
                bgcolor: '#3CB371', color: '#fff', borderRadius: 2, px: 2.5, py: 0, fontSize: 14, fontWeight: 500,
                '&:hover': { bgcolor: '#2e9e61' }, whiteSpace: 'nowrap', minWidth: 'auto',
                '&.Mui-disabled': { bgcolor: '#CBD5E1', color: '#fff' },
              }}
            >GO</Button>
          </Box>

          {/* Product list */}
          {/* Product list */}
          {products.map(p => (
            <Box key={p.id} sx={{ display: 'flex', gap: 1, py: 1.5, borderBottom: '0.5px solid #f0ecff', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={p.checked} onChange={() => toggleCheck(p.id)}
                style={{ width: 16, height: 16, accentColor: '#7C3AED', marginTop: 4, cursor: 'pointer', flexShrink: 0 }} />
              <Box sx={{ width: 52, height: 52, bgcolor: '#f0ecff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {p.image
                  ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} onError={e => e.target.style.display = 'none'} />
                  : <Typography sx={{ fontSize: 18, fontWeight: 500, color: '#7C3AED' }}>{p.desc?.[0] || 'P'}</Typography>}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1F2937', lineHeight: 1.4, mb: 0.5 }}>{p.desc}</Typography>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF', mb: 0.75 }}>Job: {p.jobNo}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: '#9CA3AF', mb: 0.25 }}>Amount</Typography>
                    <input type="number" value={p.amount} onChange={e => updateField(p.id, 'amount', e.target.value)}
                      style={{ width: 80, padding: '6px 8px', border: '1.5px solid #EDE9FE', borderRadius: 6, fontSize: 13, textAlign: 'right', color: '#1F2937', outline: 'none', background: '#fff' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: '#9CA3AF', mb: 0.25 }}>Sale price</Typography>
                    <input type="number" value={p.customSale} onChange={e => updateField(p.id, 'customSale', e.target.value)}
                      style={{ width: 80, padding: '6px 8px', border: '1.5px solid #EDE9FE', borderRadius: 6, fontSize: 13, textAlign: 'right', color: '#1F2937', outline: 'none', background: '#fff' }} />
                  </Box>
                  {/* Per-item Customize button */}
                  <Button
                    onClick={() => openCustomize(p.id)}
                    startIcon={<Settings2 size={12} />}
                    sx={{
                      bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: 1.5,
                      fontSize: 11, fontWeight: 600, px: 1.25, py: 0.5, minWidth: 'auto',
                      '&:hover': { bgcolor: '#DDD6FE' }, mb: 0.25,
                    }}
                  >
                    Customize
                  </Button>
                </Box>
              </Box>
              <Button onClick={() => removeProduct(p.id)} sx={{ minWidth: 30, width: 30, height: 30, bgcolor: '#FFF0F0', borderRadius: 1.5, p: 0, flexShrink: 0 }}>
                <Trash2 size={14} color="#E24B4A" />
              </Button>
            </Box>
          ))}

          {/* Customize All — only show when 2+ products */}
          {products.length > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                onClick={() => openCustomize(null)}
                startIcon={<Settings2 size={14} />}
                sx={{ bgcolor: '#7C3AED', color: '#fff', borderRadius: 2, fontSize: 13, fontWeight: 500, px: 2, '&:hover': { bgcolor: '#5B21B6' } }}
              >
                Customize All
              </Button>
            </Box>
          )}
        </Box>

        {/* Summary */}
        {products.length > 0 && (
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '0.5px solid #EDE9FE', p: 1.75, mb: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1F2937', mb: 1.25 }}>Bill Summary</Typography>

            {[['Total amount', fmt(total)], ['Roundoff amount', roundoff.toFixed(2)]].map(([l, v]) => (
              <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '0.5px solid #f0ecff' }}>
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{l}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>{v}</Typography>
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, my: 1.25 }}>
              <RoBtn mode="up" label="Roundup" />
              <RoBtn mode="less" label="Less" />
              <RoBtn mode="add" label="Add" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '0.5px solid #f0ecff' }}>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Add / Less</Typography>
              <input type="number" value={addLess} onChange={e => setAddLess(e.target.value)}
                style={{ width: 100, padding: '6px 10px', border: '1.5px solid #EDE9FE', borderRadius: 8, fontSize: 14, color: '#1F2937', outline: 'none', background: '#fff', textAlign: 'right' }} />
            </Box>

            <Box sx={{ height: '0.5px', bgcolor: '#EDE9FE', my: 1.25 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1F2937' }}>Final amount</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 500, color: '#7C3AED' }}>{fmt(finalAmt)}</Typography>
            </Box>

            <Box sx={{ mt: 1.25 }}>
              <Field label="Remarks">
                <input style={{ ...inp, marginTop: 4 }} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional note..." />
              </Field>
            </Box>

            <Button fullWidth sx={{ mt: 1.75, py: 1.75, bgcolor: '#7C3AED', color: '#fff', borderRadius: 3, fontSize: 15, fontWeight: 500, '&:hover': { bgcolor: '#5B21B6' } }}>
              Proceed to Bill
            </Button>
          </Box>
        )}
      </Box>
      
      <Dialog
        open={custOpen}
        onClose={() => setCustOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '90%',
            maxWidth: 420,
            mx: 'auto',
            overflow: 'visible',
          }
        }}
      >
        <DialogContent sx={{ p: 3, width: 320 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
              Set Rate Per Piece
            </Typography>
            <Box
              onClick={() => setCustOpen(false)}
              sx={{
                width: 28, height: 28, borderRadius: '50%', bgcolor: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', '&:active': { bgcolor: '#E5E7EB' },
              }}
            >
              <Typography sx={{ fontSize: 14, color: '#6B7280', lineHeight: 1 }}>✕</Typography>
            </Box>
          </Box>

          {/* Toggle: Percent per pcs / Amount per pcs */}
          <Box sx={{
            display: 'flex', bgcolor: '#F3F4F6', borderRadius: 2,
            p: 0.5, mb: 2.5, gap: 0.5,
          }}>
            {[
              { key: 'percent', label: 'Percent per pcs' },
              { key: 'amount', label: 'Amount per pcs' },
            ].map(({ key, label }) => (
              <Box
                key={key}
                onClick={() => setCustMode(key)}
                sx={{
                  flex: 1, py: 1, textAlign: 'center', borderRadius: 1.5,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  transition: 'all 0.2s',
                  bgcolor: custMode === key ? '#6B7280' : 'transparent',
                  color: custMode === key ? '#fff' : '#9CA3AF',
                  boxShadow: custMode === key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {label}
              </Box>
            ))}
          </Box>

          {/* Value input */}
          <Box sx={{
            border: '1.5px solid #E5E7EB', borderRadius: 2,
            px: 1.5, mb: 2.5,
            '&:focus-within': { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,0.1)' },
            transition: 'all 0.15s',
          }}>
            <Typography sx={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, pt: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Value {custMode === 'percent' ? '(%)' : '(Amt)'}
            </Typography>
            <input
              type="number"
              value={custValue}
              onChange={e => setCustValue(e.target.value)}
              placeholder={custMode === 'percent' ? 'e.g. 10 for 10%' : 'e.g. 500'}
              style={{
                width: '100%', border: 'none', outline: 'none',
                fontSize: 15, color: '#1F2937', background: 'transparent',
                padding: '4px 0 10px', fontFamily: 'inherit', fontWeight: 600,
              }}
            />
          </Box>

          {/* Info text */}
          <Typography sx={{ fontSize: 11, color: '#9CA3AF', mb: 2, pl: 0.5 }}>
            {custTarget === null
              ? `Will apply to all ${products.filter(p => p.checked).length} checked product(s)`
              : `Will apply to: ${products.find(p => p.id === custTarget)?.desc || ''}`
            }
          </Typography>

          {/* Apply button */}
          <Button
            fullWidth
            onClick={applyCustomize}
            sx={{
              py: 1.5, bgcolor: '#27AE60', color: '#fff', borderRadius: 2,
              fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
              '&:hover': { bgcolor: '#219653' },
              '&:active': { transform: 'scale(0.98)' },
              transition: 'all 0.15s',
            }}
          >
            APPLY
          </Button>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </Box>
  );
}
