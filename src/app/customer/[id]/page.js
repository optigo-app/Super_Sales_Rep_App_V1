'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import {
  ArrowLeft, Phone, MessageCircle, Mail, ChevronRight,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { CRMCustomerLog } from '@/Utils/API/CRMCustomerLog/CRMCustomerLog';
import LoadingBackdrop from '@/Utils/LoadingBackdrop';
import DashboardTab from './DashboardTab/DashboardTab';
import ReportsTab from './ReportsTab/ReportsTab';

const tabs = ['Dashboard', 'Reports', 'Actions'];

const statusColor = {
  active: { bg: 'rgba(16,185,129,0.25)', color: '#6EE7B7' },
  new: { bg: 'rgba(16,185,129,0.25)', color: '#6EE7B7' },
  inactive: { bg: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)' },
};

function ActionsTab({ customerId }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <p>No Data </p>
    </Box>
  );
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id || '';

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  // ── API data ──
  const [lastOrderData, setLastOrderData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  // Load customer info from sessionStorage (set when clicking the card)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('selectedCustomer');
      if (saved) setCustomerInfo(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to parse selectedCustomer', e);
    }
  }, []);

  // Fetch last 3 orders + payments
  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    CRMCustomerLog('CRM_Customer_LastThree_Order_Payment', customerId)
      .then((response) => {
        if (response.Status === '200') {
          if (response.Data?.rd?.length) setLastOrderData(response.Data.rd);
          if (response.Data?.rd1?.length) setPaymentData(response.Data.rd1);
        }
      })
      .catch((err) => console.error('API Error:', err))
      .finally(() => setIsLoading(false));
  }, [customerId]);

  // ── Display values — read from customerInfo (list data) ──
  const displayName = customerInfo?.FLname || customerInfo?.Name || 'Customer';
  const displayCompany = customerInfo?.Firmname || customerInfo?.Company || '';
  const displayPhone = customerInfo?.mobileno || customerInfo?.Mobile || '—';
  const displayEmail = customerInfo?.email1 || customerInfo?.Email || '—';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayStatus = customerInfo?._status || 'active';
  const sc = statusColor[displayStatus] ?? statusColor.active;

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
      <LoadingBackdrop isLoading={isLoading} />
      <Box sx={{ px: 2, pt: 1.5, pb: '80px' }}>
        {/* Back */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            onClick={() => router.back()}
            sx={{
              width: 36, height: 36, borderRadius: '50%', bgcolor: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 6px rgba(124,58,237,0.1)', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              '&:active': { transform: 'scale(0.9)' }, transition: 'transform 0.15s',
            }}
          >
            <ArrowLeft size={18} color="#1F2937" />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Customer Profile</Typography>
        </Box>

        {/* ── Profile Banner ── */}
        <Box sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9F7AEA 100%)', borderRadius: 3, p: 2.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{
              width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.22)',
              fontSize: 22, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,0.35)',
            }}>
              {displayInitial}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                <Typography sx={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>{displayName}</Typography>
                <Chip
                  label={displayStatus}
                  size="small"
                  sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 10, height: 20, '& .MuiChip-label': { px: 0.8 } }}
                />
              </Box>
              {displayCompany && (
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{displayCompany}</Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
            {[
              {
                label: 'Call',
                icon: Phone,
                color: '#7C3AED',
                action: () => {
                  if (displayPhone !== '—') {
                    window.location.href = `tel:${displayPhone.replace(/\D/g, '')}`;
                  }
                },
              },
              { label: 'WhatsApp', icon: MessageCircle, color: '#10B981', action: () => displayPhone !== '—' && window.open(`https://wa.me/91${displayPhone}`, '_blank') },
              { label: 'Email', icon: Mail, color: '#06B6D4', action: () => displayEmail !== '—' && (window.location.href = `mailto:${displayEmail}`) },
            ].map(({ label, icon: Icon, color, action }) => (
              <Box
                key={label}
                onClick={action}
                sx={{
                  bgcolor: '#fff', borderRadius: 2, py: 1.25,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  '&:active': { transform: 'scale(0.94)', bgcolor: 'white' }, transition: 'all 0.15s',
                }}
              >
                <Icon size={18} color={color} strokeWidth={2.2} />
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1F2937' }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Contact row */}
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, p: 1.5 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, mb: 0.4 }}>{displayPhone}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{displayEmail}</Typography>
          </Box>
        </Box>

        {/* ── Tabs ── */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)', mb: 2 }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
            {tabs.map((tab) => (
              <Box
                key={tab}
                onClick={() => setActiveTab(tab)}
                sx={{
                  flex: 1, textAlign: 'center', py: 1.5, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  color: activeTab === tab ? '#7C3AED' : '#6B7280',
                  borderBottom: activeTab === tab ? '2px solid #7C3AED' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 2 }}>
            {activeTab === 'Dashboard' && <DashboardTab customerId={customerId} customerInfo={customerInfo}/>}
            {activeTab === 'Reports' && <ReportsTab customerId={customerId} customerInfo={customerInfo}/>}
            {activeTab === 'Actions' && <ActionsTab customerId={customerId} customerInfo={customerInfo}/>}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}