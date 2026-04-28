'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import {
  Search, Phone, ChevronRight, Plus,
  ArrowLeft, Camera, Check, X, User, Mail,
  MapPin, Building2, Briefcase, ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import { CommonAPImain } from '@/Utils/API/CommonAPImain/CommonAPImain';
import { newCustomerAdd } from '@/Utils/API/newCustomerAdd/newCustomerAdd';
import LoadingBackdrop from '@/Utils/LoadingBackdrop';

// ─── Status config ───────────────────────────────────────────
const statusColor = {
  active: { bg: '#DCFCE7', color: '#16A34A' },
  new: { bg: '#EDE9FE', color: '#7C3AED' },
  inactive: { bg: '#F3F4F6', color: '#6B7280' },
};

const filters = ['All', 'New', 'Active', 'Inactive'];

// ─── Toast ───────────────────────────────────────────────────
function Toast({ message, type = 'success', visible }) {
  if (!visible) return null;
  return (
    <Box sx={{
      position: 'fixed', bottom: 110, left: '50%',
      transform: 'translateX(-50%)',
      bgcolor: type === 'success' ? '#059669' : '#EF4444',
      color: '#fff', px: 2.5, py: 1.25, borderRadius: 3,
      fontSize: 13, fontWeight: 600, zIndex: 3000,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 1,
    }}>
      {type === 'success' ? <Check size={14} /> : <X size={14} />}
      {message}
    </Box>
  );
}

// ─── FloatingInput ───────────────────────────────────────────
function FloatingInput({ label, icon: Icon, required, error, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        bgcolor: '#fff',
        border: error ? '1.5px solid #EF4444' : '1.5px solid #E5E7EB',
        borderRadius: 2.5,
        px: 1.5, py: 0,
        transition: 'border-color 0.15s',
        '&:focus-within': {
          borderColor: error ? '#EF4444' : '#7C3AED',
          boxShadow: error
            ? '0 0 0 3px rgba(239,68,68,0.1)'
            : '0 0 0 3px rgba(124,58,237,0.1)',
        },
      }}>
        {Icon && (
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <Icon size={16} color={error ? '#EF4444' : '#9CA3AF'} strokeWidth={2} />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 10, color: error ? '#EF4444' : '#9CA3AF', fontWeight: 600, pt: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {label}{required && ' *'}
          </Typography>
          {children}
        </Box>
      </Box>
      {error && (
        <Typography sx={{ fontSize: 11, color: '#EF4444', mt: 0.4, pl: 1 }}>{error}</Typography>
      )}
    </Box>
  );
}

const inputStyle = {
  width: '100%', border: 'none', outline: 'none',
  fontSize: 14, color: '#1F2937', background: 'transparent',
  padding: '2px 0 8px 0', fontFamily: 'inherit', fontWeight: 500,
};
function AddCustomerModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', mobile: '', email: '',
    company: '', companyTypeId: '', companyTypeName: '',
    country: '', state: '', city: '', pincode: '', area: '', fullAddress: '',
    InHelloApp: 1,
  });
  const [errors, setErrors] = useState({});
  const [companyTypes, setCompanyTypes] = useState([]);
  const [showTypes, setShowTypes] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (!open) return;
    CommonAPImain('GetCompanyType')
      .then((res) => { if (res?.Data?.rd) setCompanyTypes(res.Data.rd); })
      .catch(console.error);
  }, [open]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const handleMobile = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, mobile: digits }));
    setErrors((er) => ({ ...er, mobile: '' }));
  };

  const handlePincode = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setForm((f) => ({ ...f, pincode: digits }));
  };

  const showToastMsg = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    if (!form.email.trim()) e.email = 'Email is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const response = await newCustomerAdd(
        'Catelog_SendAlbum_NewCustomer', '',
        form.firstName, form.lastName, form.city, form.company,
        form.mobile, form.email, form.companyTypeId, form.companyTypeName, form.InHelloApp,
      );
      const msg = response?.Data?.rd?.[0]?.Msg;
      if (msg === 'mobileexists') {
        showToastMsg('Mobile number already exists!', 'error');
      } else {
        showToastMsg('Customer saved successfully!', 'success');
        setForm({
          firstName: '', lastName: '', mobile: '', email: '',
          company: '', companyTypeId: '', companyTypeName: '',
          country: '', state: '', city: '', pincode: '', area: '', fullAddress: '',
          InHelloApp: 1,
        });
        setShowBusiness(false);
        setTimeout(() => { onSaved?.(); onClose(); }, 1500);
      }
    } catch (err) {
      showToastMsg('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', bgcolor: '#F8F7FF' }}>
      <LoadingBackdrop isLoading={submitting} />
      <Toast {...toast} />

      {/* Top bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.5, bgcolor: '#fff',
        borderBottom: '1px solid #F3F4F6',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 8px rgba(124,58,237,0.06)',
      }}>
        <Box onClick={onClose} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} color="#1F2937" />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#1F2937' }}>Add Customer</Typography>
        </Box>
        <Box onClick={handleSave} sx={{
          bgcolor: '#7C3AED', color: '#fff', px: 2, py: 0.75,
          borderRadius: 2, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.75,
          WebkitTapHighlightColor: 'transparent',
          '&:active': { opacity: 0.85, transform: 'scale(0.97)' },
          transition: 'all 0.15s',
        }}>
          <Check size={15} strokeWidth={2.5} />
          Save
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2, pb: 6 }}>

        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
            border: '2.5px dashed #7C3AED',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 0.5,
            WebkitTapHighlightColor: 'transparent',
            '&:active': { opacity: 0.7 },
          }}>
            <Camera size={22} color="#7C3AED" strokeWidth={1.8} />
            <Typography sx={{ fontSize: 9, color: '#7C3AED', fontWeight: 700, letterSpacing: '0.05em' }}>PHOTO</Typography>
          </Box>
        </Box>

        {/* ── PERSONAL INFO ── */}
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
          Personal Info
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <FloatingInput label="First Name" icon={User} required error={errors.firstName}>
              <input value={form.firstName} onChange={set('firstName')} style={inputStyle} placeholder="John" />
            </FloatingInput>
          </Box>
          <Box sx={{ flex: 1 }}>
            <FloatingInput label="Last Name" required error={errors.lastName}>
              <input value={form.lastName} onChange={set('lastName')} style={inputStyle} placeholder="Doe" />
            </FloatingInput>
          </Box>
        </Box>

        <FloatingInput label="Mobile" icon={Phone} required error={errors.mobile}>
          <input type="tel" value={form.mobile} onChange={handleMobile} style={inputStyle} placeholder="10-digit number" maxLength={10} />
        </FloatingInput>

        <FloatingInput label="Email" icon={Mail} required error={errors.email}>
          <input type="email" value={form.email} onChange={set('email')} style={inputStyle} placeholder="john@example.com" />
        </FloatingInput>

        {/* ── ADD OTHER INFO TOGGLE ── */}
        <Box
          onClick={() => setShowBusiness((v) => !v)}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            cursor: 'pointer', mb: 2, mt: 0.5,
            WebkitTapHighlightColor: 'transparent',
            '&:active': { opacity: 0.7 },
          }}
        >
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%',
            bgcolor: '#EDE9FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, transform 0.2s',
            ...(showBusiness && { bgcolor: '#DDD6FE', transform: 'scale(1.1)' }),
          }}>
            {showBusiness
              ? <span style={{ fontSize: 14, color: '#7C3AED', lineHeight: 1, fontWeight: 700 }}>−</span>
              : <Plus size={12} color="#7C3AED" strokeWidth={2.5} />
            }
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {showBusiness ? 'Hide other info' : 'Add other info'}
          </Typography>
          <ChevronDown
            size={14}
            color="#7C3AED"
            style={{
              transform: showBusiness ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </Box>

        {/* ── BUSINESS INFO (animated) ── */}
        <Box sx={{
          overflow: 'hidden',
          maxHeight: showBusiness ? '1200px' : '0px',
          opacity: showBusiness ? 1 : 0,
          transform: showBusiness ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease, transform 0.35s ease',
        }}>
          {/* Divider */}
          <Box sx={{ height: '1px', background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)', mb: 2 }} />

          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
            Business Info
          </Typography>

          <FloatingInput label="Company Name" icon={Building2}>
            <input value={form.company} onChange={set('company')} style={inputStyle} placeholder="Company name" />
          </FloatingInput>

          {/* Company Type dropdown */}
          <Box sx={{ mb: 1.5 }}>
            <Box
              onClick={() => setShowTypes((v) => !v)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: '#fff', border: '1.5px solid #E5E7EB',
                borderRadius: 2.5, px: 1.5, py: 0,
                cursor: 'pointer', transition: 'border-color 0.15s',
                ...(showTypes && { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,0.1)' }),
              }}
            >
              <Briefcase size={16} color="#9CA3AF" strokeWidth={2} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, pt: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Company Type
                </Typography>
                <Typography sx={{ fontSize: 14, color: form.companyTypeName ? '#1F2937' : '#9CA3AF', pb: 1, fontWeight: form.companyTypeName ? 500 : 400 }}>
                  {form.companyTypeName || 'Select type'}
                </Typography>
              </Box>
              <ChevronDown size={16} color="#9CA3AF" style={{ transform: showTypes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </Box>
            {showTypes && (
              <Box sx={{ mt: 0.5, border: '1.5px solid #E5E7EB', borderRadius: 2, overflow: 'hidden', maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                {companyTypes.length === 0
                  ? <Typography sx={{ px: 2, py: 1.5, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>No types found</Typography>
                  : companyTypes.map((ct) => (
                    <Box
                      key={ct.CompanyTypeId}
                      onClick={() => { setForm((f) => ({ ...f, companyTypeId: ct.CompanyTypeId, companyTypeName: ct.CompanyTypeName })); setShowTypes(false); }}
                      sx={{
                        px: 2, py: 1.25, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: form.companyTypeId === ct.CompanyTypeId ? '#7C3AED' : '#1F2937',
                        bgcolor: form.companyTypeId === ct.CompanyTypeId ? '#F5F3FF' : '#fff',
                        borderBottom: '1px solid #F3F4F6',
                        fontWeight: form.companyTypeId === ct.CompanyTypeId ? 600 : 400,
                        '&:last-child': { borderBottom: 'none' },
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {ct.CompanyTypeName}
                      {form.companyTypeId === ct.CompanyTypeId && <Check size={14} color="#7C3AED" />}
                    </Box>
                  ))
                }
              </Box>
            )}
          </Box>

          {/* Country + State */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <FloatingInput label="Country" icon={MapPin}>
                <input value={form.country} onChange={set('country')} style={inputStyle} placeholder="India" />
              </FloatingInput>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FloatingInput label="State">
                <input value={form.state} onChange={set('state')} style={inputStyle} placeholder="Gujarat" />
              </FloatingInput>
            </Box>
          </Box>

          {/* City + Pincode */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <FloatingInput label="City" icon={MapPin}>
                <input value={form.city} onChange={set('city')} style={inputStyle} placeholder="Surat" />
              </FloatingInput>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FloatingInput label="Pincode">
                <input type="tel" value={form.pincode} onChange={handlePincode} style={inputStyle} placeholder="395001" maxLength={6} />
              </FloatingInput>
            </Box>
          </Box>

          <FloatingInput label="Area / Location" icon={MapPin}>
            <input value={form.area} onChange={set('area')} style={inputStyle} placeholder="Ring Road, Adajan..." />
          </FloatingInput>

          <FloatingInput label="Full Address" icon={MapPin}>
            <textarea
              value={form.fullAddress}
              onChange={set('fullAddress')}
              rows={2}
              style={{ ...inputStyle, resize: 'none', paddingTop: '2px' }}
              placeholder="Enter full address..."
            />
          </FloatingInput>
        </Box>

        {/* Save button */}
        <Box
          onClick={handleSave}
          sx={{
            bgcolor: submitting ? '#9F7AEA' : '#7C3AED',
            borderRadius: 3, py: 1.75,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            WebkitTapHighlightColor: 'transparent',
            '&:active': !submitting ? { transform: 'scale(0.98)', bgcolor: '#6D28D9' } : {},
            transition: 'all 0.15s',
            mt: 1,
          }}
        >
          {!submitting && <Check size={17} color="#fff" strokeWidth={2.5} />}
          <Typography sx={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>
            {submitting ? 'Saving…' : 'Save Customer'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function getInitial(item) {
  const name = item.FLname || item.Name || '';
  return name.charAt(0).toUpperCase() || '?';
}
function getStatus(item) {
  return item._status || 'active';
}

// ─── CustomerPage ─────────────────────────────────────────────
export default function CustomerPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newRows, setNewRows] = useState([]);
  const [activeRows, setActiveRows] = useState([]);
  const [inactiveRows, setInactiveRows] = useState([]);

  const fetchNew = () => {
    setIsLoading(true);
    CommonAPImain('CRM_NewCustomerList')
      .then((res) => { if (res?.Data?.rd) setNewRows(res.Data.rd.map((item, i) => ({ id: i + 1, _status: 'new', ...item }))); })
      .catch(console.error).finally(() => setIsLoading(false));
  };
  const fetchActive = () => {
    setIsLoading(true);
    CommonAPImain('CRM_ActiveCustomerList')
      .then((res) => { if (res?.Data?.rd) setActiveRows(res.Data.rd.map((item, i) => ({ id: i + 1, _status: 'active', ...item }))); })
      .catch(console.error).finally(() => setIsLoading(false));
  };
  const fetchInactive = () => {
    setIsLoading(true);
    CommonAPImain('CRM_InActiveCustomerList')
      .then((res) => { if (res?.Data?.rd) setInactiveRows(res.Data.rd.map((item, i) => ({ id: i + 1, _status: 'inactive', ...item }))); })
      .catch(console.error).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchNew(); fetchActive(); fetchInactive(); }, []);
  const handleSaved = () => { fetchNew(); fetchActive(); fetchInactive(); };

  const sourceList = (() => {
    if (activeFilter === 'New') return newRows;
    if (activeFilter === 'Active') return activeRows;
    if (activeFilter === 'Inactive') return inactiveRows;
    return [...newRows, ...activeRows, ...inactiveRows];
  })();

  const filtered = sourceList.filter((c) => {
    const name = (c.FLname || c.Name || '').toLowerCase();
    const company = (c.CompanyName || c.Company || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || company.includes(q);
  });

  return (
    <Box sx={{ bgcolor: '#F8F7FF', minHeight: '100vh' }}>
      <LoadingBackdrop isLoading={isLoading} />
      <Header />

      <Box sx={{ px: 2, pt: 2, pb: '90px' }}>

        {/* Page title + count */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#1F2937', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
              Customers
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.3 }}>
              {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          bgcolor: '#fff', borderRadius: 3, px: 1.5, py: 1.25, mb: 2,
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 1px 8px rgba(124,58,237,0.05)',
          '&:focus-within': { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,0.1)' },
          transition: 'all 0.15s',
        }}>
          <Search size={17} color="#9CA3AF" strokeWidth={2.2} />
          <Box
            component="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or company…"
            sx={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14,
              color: '#1F2937', bgcolor: 'transparent', fontFamily: 'inherit',
              '&::placeholder': { color: '#C4C9D4' },
            }}
          />
          {search && (
            <Box onClick={() => setSearch('')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={14} color="#9CA3AF" />
            </Box>
          )}
        </Box>

        {/* Filter chips */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {filters.map((f) => {
            const counts = { All: sourceList.length, New: newRows.length, Active: activeRows.length, Inactive: inactiveRows.length };
            const active = activeFilter === f;
            return (
              <Box
                key={f}
                onClick={() => setActiveFilter(f)}
                sx={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.6,
                  px: 1.5, py: 0.6, borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                  '&:active': { transform: 'scale(0.95)' },
                  bgcolor: active ? '#7C3AED' : '#fff',
                  color: active ? '#fff' : '#6B7280',
                  border: active ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                  boxShadow: active ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
                }}
              >
                {f}
                <Box sx={{
                  fontSize: 10, fontWeight: 700, px: 0.7, py: 0.1, borderRadius: 10,
                  bgcolor: active ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                  color: active ? '#fff' : '#6B7280',
                  minWidth: 18, textAlign: 'center',
                }}>
                  {counts[f]}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Customer list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.length === 0 && !isLoading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                <User size={24} color="#7C3AED" strokeWidth={1.8} />
              </Box>
              <Typography sx={{ color: '#9CA3AF', fontSize: 14, fontWeight: 500 }}>No customers found</Typography>
              <Typography sx={{ color: '#C4C9D4', fontSize: 12, mt: 0.5 }}>Try a different search or filter</Typography>
            </Box>
          )}

          {filtered.map((c) => {
            const status = getStatus(c);
            const sc = statusColor[status] ?? statusColor.active;
            const name = c.FLname || c.Name || '—';
            const company = c.email1 || c.Company || '';
            const mobile = c.mobileno || '';

            return (
              <Box
                key={`${status}-${c.id}`}
                sx={{
                  bgcolor: '#fff', borderRadius: 3,
                  border: '1.5px solid #F0EEFF',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.5,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                  '&:active': { transform: 'scale(0.99)', bgcolor: '#FAFAFF', borderColor: '#DDD6FE' },
                  boxShadow: '0 1px 4px rgba(124,58,237,0.05)',
                }}
                onClick={() => {
                  sessionStorage.setItem('selectedCustomer', JSON.stringify(c));
                  router.push(`/customer/${c.id}`);
                }}
              >
                {/* Avatar */}
                <Avatar sx={{
                  width: 44, height: 44, flexShrink: 0,
                  bgcolor: status === 'new' ? '#7C3AED' : status === 'inactive' ? '#9CA3AF' : '#059669',
                  fontSize: 16, fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}>
                  {getInitial(c)}
                </Avatar>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                    <Typography sx={{
                      fontSize: 14, fontWeight: 700, color: '#1F2937',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {name}
                    </Typography>
                    <Box sx={{ flexShrink: 0, bgcolor: sc.bg, color: sc.color, fontSize: 9, fontWeight: 700, px: 0.8, py: 0.2, borderRadius: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {status}
                    </Box>
                  </Box>
                  {company && (
                    <Typography sx={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {company}
                    </Typography>
                  )}
                  {mobile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                      <Phone size={10} color="#9CA3AF" strokeWidth={2} />
                      <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>{mobile}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mobile) window.location.href = `tel:${mobile.replace(/\D/g, '')}`;
                    }}
                    sx={{
                      width: 34, height: 34, borderRadius: 2,
                      bgcolor: '#EDE9FE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      WebkitTapHighlightColor: 'transparent',
                      '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.9)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Phone size={14} color="#7C3AED" strokeWidth={2.2} />
                  </Box>
                  <ChevronRight size={15} color="#C4C9D4" />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* FAB */}
      <Box
        onClick={() => setModalOpen(true)}
        sx={{
          position: 'fixed',
          right: 'max(20px, calc(50% - 220px))',
          bottom: 90,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C3AED, #9F7AEA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
          cursor: 'pointer', zIndex: 400,
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s',
          '&:active': { transform: 'scale(0.9)', boxShadow: '0 2px 10px rgba(124,58,237,0.3)' },
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </Box>

      <AddCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      {!modalOpen && <BottomNav />}
    </Box>
  );
}