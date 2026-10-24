'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Chip, CircularProgress } from '@mui/material';
import {
  ArrowLeft, Phone, MessageCircle, Mail,
  ShoppingBag, TrendingUp, AlertCircle, ChevronRight, PhoneCall,
} from 'lucide-react';
import { CRMCustomerLog } from '@/Utils/API/CRMCustomerLog/CRMCustomerLog';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
);
import dynamic from 'next/dynamic';

const Bar = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Bar),
  { ssr: false }
);

const PolarArea = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.PolarArea),
  { ssr: false }
);

export default function DashboardTab({ customerId }) {
  const [isLoading, setIsLoading]                       = useState(false);
  const [lastOrderData, setLastOrderData]               = useState([]);
  const [paymentData, setPaymentData]                   = useState([]);
  const [categoryData, setCategoryData]                 = useState({ labels: [], data: [] });
  const [monthlySaleChartData, setMonthlySaleChartData] = useState([]);
  const [callLogs, setCallLogs]                         = useState([]);

  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    CRMCustomerLog('CRM_Customer_LastThree_Order_Payment', customerId)
      .then((res) => {
        if (res.Status === '200') {
          if (res.Data?.rd?.length)  setLastOrderData(res.Data.rd);
          if (res.Data?.rd1?.length) setPaymentData(res.Data.rd1);
        }
      })
      .catch(console.error);

    CRMCustomerLog('CRM_Customer_CategoryWiseSale', customerId)
      .then((res) => {
        if (res.Status === '200' && res.Data?.rd?.length) {
          setCategoryData({
            labels: res.Data.rd.map((i) => i.Category),
            data:   res.Data.rd.map((i) => i.SaleAmount),
          });
        }
      })
      .catch(console.error);

    CRMCustomerLog('CRM_Customer_SaleChart', customerId)
      .then((res) => {
        if (res.Data?.rd?.length) setMonthlySaleChartData(res.Data.rd);
      })
      .catch(console.error);

    CRMCustomerLog('CRM_Customer_CallLog', customerId)
      .then((res) => {
        if (res.Data?.rd?.length) setCallLogs(res.Data.rd);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [customerId]);

  const polarData = {
    labels: categoryData.labels,
    datasets: [{
      data: categoryData.data,
      backgroundColor: ['#C4B5FD', '#FDE68A', '#FBCFE8', '#6EE7B7', '#FED7AA'],
      borderWidth: 1,
    }],
  };

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { r: { ticks: { display: false }, pointLabels: { display: false } } },
    plugins: { legend: { position: 'top' } },
  };

  const barData = {
    labels: monthlySaleChartData.map((i) => i.Month_Name),
    datasets: [{
      maxBarThickness: 15,
      label: 'Sale',
      backgroundColor: '#7C3AED',
      borderColor: 'transparent',
      borderRadius: { topLeft: 6, topRight: 6 },
      data: monthlySaleChartData.map((i) => i.SaleAmount),
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    scales: {
      x: { grid: { drawTicks: false } },
      y: { min: 0, grid: { display: false } },
    },
    plugins: { legend: { align: 'end', position: 'top' } },
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  const hasAnyData =
    lastOrderData.length > 0 || paymentData.length > 0 ||
    categoryData.data.length > 0 || monthlySaleChartData.length > 0 || callLogs.length > 0;

  if (!hasAnyData) {
    return (
      <Typography sx={{ textAlign: 'center', color: '#9CA3AF', py: 5, fontSize: 13 }}>
        No data available.
      </Typography>
    );
  }

  return (
    <>
      {/* ── Stats Row ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2.5 }}>
        {[
          { icon: ShoppingBag, bg: '#EDE9FE', color: '#7C3AED', value: lastOrderData.length || '0', label: 'Orders' },
          { icon: TrendingUp,  bg: '#ECFDF5', color: '#10B981', value: paymentData.length  || '0', label: 'Payments' },
          { icon: PhoneCall,   bg: '#FFF7ED', color: '#F97316', value: callLogs.length     || '0', label: 'Call Logs' },
        ].map(({ icon: Icon, bg, color, value, label }) => (
          <Box key={label} sx={{ bgcolor: 'white', borderRadius: 2.5, p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.3 }}>
              <Icon size={17} color={color} strokeWidth={2.2} />
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>{value}</Typography>
            <Typography sx={{ fontSize: 10, color: '#6B7280', textAlign: 'center' }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* ── Last 3 Orders ── */}
      {lastOrderData.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', mb: 1.5 }}>Last 3 Orders</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', bgcolor: '#7C3AED', borderRadius: '8px 8px 0 0', px: 1.5, py: 1 }}>
            {['Order No', 'Category', 'Status'].map((h) => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{h}</Typography>
            ))}
          </Box>

          <Box sx={{ border: '1px solid rgba(124,58,237,0.1)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            {lastOrderData.map((order, index) => (
              <Box key={order.SrNo ?? index}
                sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', px: 1.5, py: 1.1, bgcolor: index % 2 === 0 ? '#fff' : 'white', borderBottom: index < lastOrderData.length - 1 ? '1px solid rgba(124,58,237,0.07)' : 'none', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#1F2937', textAlign: 'center', fontWeight: 600 }}>{order.JobVersionNo || '—'}</Typography>
                <Typography sx={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>{order.categorycode || '—'}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={order.ProgressStatusName || '—'}
                    size="small"
                    sx={{
                      fontSize: 9, height: 18, fontWeight: 600,
                      bgcolor: order.ProgressStatusName === 'Delivered' ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)',
                      color:   order.ProgressStatusName === 'Delivered' ? '#059669' : '#F97316',
                      '& .MuiChip-label': { px: 0.6 },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Last 3 Payments ── */}
      {paymentData.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', mb: 1.5 }}>Last 3 Payments</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1fr', bgcolor: '#10B981', borderRadius: '8px 8px 0 0', px: 1.5, py: 1 }}>
            {['#', 'Amount', 'Date'].map((h) => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{h}</Typography>
            ))}
          </Box>

          <Box sx={{ border: '1px solid rgba(16,185,129,0.15)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            {paymentData.map((payment, index) => (
              <Box key={payment.SrNo ?? index}
                sx={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1fr', px: 1.5, py: 1.1, bgcolor: index % 2 === 0 ? '#fff' : '#F0FDF4', borderBottom: index < paymentData.length - 1 ? '1px solid rgba(16,185,129,0.08)' : 'none' }}>
                <Typography sx={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>{index + 1}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#10B981', textAlign: 'center' }}>Amt {payment.Amount}</Typography>
                <Typography sx={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>{payment.PaymentDate}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Category Wise Sale Chart ── */}
      {categoryData.data.length > 0 && (
        <Box sx={{ mb: 2.5, bgcolor: '#fff', borderRadius: 3, p: 2, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
            Category Wise Sale (Current Month)
          </Typography>
          <Box sx={{ height: 220 }}>
            <PolarArea data={polarData} options={polarOptions} />
          </Box>
        </Box>
      )}

      {/* ── Monthly Sale Bar Chart ── */}
      {monthlySaleChartData.length > 0 && (
        <Box sx={{ mb: 2.5, bgcolor: '#fff', borderRadius: 3, p: 2, boxShadow: '0 1px 6px rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.06)' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
            Monthly Sale Amount
          </Typography>
          <Box sx={{ height: 220 }}>
            <Bar data={barData} options={barOptions} />
          </Box>
        </Box>
      )}

      {/* ── Call Logs ── */}
      {callLogs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F2937', mb: 1.5 }}>Call Logs</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1.2fr 1.6fr', bgcolor: '#6366F1', borderRadius: '8px 8px 0 0', px: 1.5, py: 1 }}>
            {['Type', 'Date', 'Customer', 'Note'].map((h) => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{h}</Typography>
            ))}
          </Box>

          <Box sx={{ border: '1px solid rgba(99,102,241,0.15)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            {callLogs.map((log, index) => (
              <Box key={index}
                sx={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1.2fr 1.6fr', px: 1.5, py: 1.1, bgcolor: index % 2 === 0 ? '#fff' : '#EEF2FF', borderBottom: index < callLogs.length - 1 ? '1px solid rgba(99,102,241,0.08)' : 'none', alignItems: 'center' }}>
                {/* Incoming = left arrow (blue), Outgoing = right arrow (green) */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '50%',
                    bgcolor: log.CallStatus === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ fontSize: 12, color: log.CallStatus === 1 ? '#10B981' : '#3B82F6' }}>
                      {log.CallStatus === 1 ? '↗' : '↙'}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>{log.CallDate}</Typography>
                <Typography sx={{ fontSize: 11, color: '#1F2937', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.CustomerName}</Typography>
                <Typography sx={{ fontSize: 11, color: '#6B7280', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.FullSpecialNote || 'No note'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}
