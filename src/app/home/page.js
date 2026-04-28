'use client';

import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import {
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  UserPlus,
  BarChart3,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommonAPImain } from '@/Utils/API/CommonAPImain/CommonAPImain';
import LoadingBackdrop from '@/Utils/LoadingBackdrop';


const quickActions = [
  {
    label: 'Sale Overview',
    icon: BarChart3,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    path: '/sale-overview',
  },
  {
    label: 'Category Sale',
    icon: Tag,
    iconBg: '#CCFBF1',
    iconColor: '#0D9488',
    path: '/categorySale',
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAmount(value) {
  if (value == null || value === 0) return 'Amt 0';
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `Amt${value}`;
}

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [newCustomers, setNewCustomers] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    sale: null,
    order: null,
    outstanding: null,
    category: [],
    chart: [],
    catalogList: null,
    userData: null,
  });


  const stats = [
    {
      label: "Today's Sales",
      value: formatAmount(dashboardData?.sale?.SaleAmount),
      icon: TrendingUp,
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
    },
    {
      label: "Today's Orders",
      value: String(dashboardData?.order?.Qut_Job ?? 0),
      icon: ShoppingBag,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
    },
    {
      label: 'Outstanding',
      value: formatAmount(dashboardData?.outstanding?.rd?.[0]?.TotalDueAmount),
      icon: AlertCircle,
      iconBg: '#FFF7ED',
      iconColor: '#F97316',
    },
    {
      label: 'New Customers',
      value: String(newCustomers.length),
      icon: UserPlus,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
    },
  ];

  const fetchData = async () => {
    try {
      const [
        saleChartRes,
        categoryRes,
        saleRes,
        orderRes,
        outstandingRes,
        catalogRes,
        userRes,
      ] = await Promise.all([
        CommonAPImain("Home_SaleChart"),
        CommonAPImain("Home_CategorySale"),
        CommonAPImain("Home_Sale"),
        CommonAPImain("Home_Order"),
        CommonAPImain("Home_Outstanding"),
        CommonAPImain("Catelog_List"),
        CommonAPImain("UserDetail"),
      ]);
      const newState = {
        chart: saleChartRes?.Data || [],
        category: categoryRes?.Data?.rd || [],
        sale: saleRes?.Data?.rd?.[0] || null,
        order: orderRes?.Data?.rd?.[0] || null,
        outstanding: outstandingRes?.Data || null,
        catalogList: catalogRes?.Data || null,
        userData: userRes?.Data || null,
      };
      setDashboardData(newState);
      sessionStorage.setItem("dashboardData", JSON.stringify(newState));
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // http://localhost:6008/V1/home/?SV="1"&token=""&SpVer=V1&AppVer=1.0.1
    // https://testsupersales.optigoapps.com/V1/?SV=${SharedPrefsHelper.getInt("SV")??""}&token=${SharedPrefsHelper.getString("login_token")??""}&SpVer=V1&AppVer=1.0.1
    const queryParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    const token_url = queryParams.get("token");
    const SV = queryParams.get("SV");
    const SpVer = queryParams.get("SpVer");
    const AppVer = queryParams.get("AppVer");

    sessionStorage.setItem("token", token_url ?? "");
    sessionStorage.setItem("SV", SV ?? "");
    sessionStorage.setItem("SpVer", SpVer ?? "");
    sessionStorage.setItem("AppVer", AppVer ?? "");

  }, []);

  useEffect(() => {
    const cache = sessionStorage.getItem("dashboardData");
    if (cache) {
      setDashboardData(JSON.parse(cache));
      setIsLoading(false);
    } else {
      fetchData();
    }
    const interval = setInterval(fetchData, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    CommonAPImain("CRM_NewCustomerList")
      .then((response) => {
        if (response?.Data?.rd) {
          setNewCustomers(
            response.Data.rd.map((item, index) => ({
              id: index + 1,
              ...item,
            }))
          );
        }
      })
      .catch((err) => {
        setIsLoading(false);
      });
  }, []);

  const top5Customers = [...newCustomers]
    .sort((a, b) => new Date(b.EntryDate) - new Date(a.EntryDate))
    .slice(0, 5);

  return (
    <Box sx={{ bgcolor: '#F5F3FF', minHeight: '100vh' }}>
      <LoadingBackdrop isLoading={isLoading} />
      <Header />
      <Box sx={{ px: 2, pb: '80px' }}>
        {/* greeting banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #9F7AEA 100%)',
            borderRadius: 3,
            p: 2.5,
            mt: 2,
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, mb: 0.5 }}>
              {getGreeting()}
            </Typography>
            <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 700, mb: 0.4 }}>
              {dashboardData?.userData?.rd[0]?.firstname} {dashboardData?.userData?.rd[0]?.lastname}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {formatDate()}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: 'rgba(255,255,255,0.22)',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            E
          </Avatar>
        </Box>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Box
                key={s.label}
                sx={{
                  bgcolor: '#fff',
                  borderRadius: 3,
                  p: 2,
                  boxShadow: '0 1px 6px rgba(124,58,237,0.07)',
                  border: '1px solid rgba(124,58,237,0.06)',
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: s.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <Icon size={20} color={s.iconColor} strokeWidth={2.2} />
                </Box>
                <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.3 }}>
                  {s.label}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>
                  {s.value}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Quick Actions */}
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937', mb: 1.5 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <Box
                key={qa.label}
                onClick={() => router.push(qa.path)}
                sx={{
                  bgcolor: '#fff',
                  borderRadius: 3,
                  p: 2.5,
                  boxShadow: '0 1px 6px rgba(124,58,237,0.07)',
                  border: '1px solid rgba(124,58,237,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  '&:active': { transform: 'scale(0.96)', bgcolor: '#F5F3FF' },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    bgcolor: qa.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={qa.iconColor} strokeWidth={2} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1F2937', textAlign: 'center' }}>
                  {qa.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* New Customers */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
            New Customers
          </Typography>
          <Box
            onClick={() => router.push('/customer')}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: '#7C3AED',
              cursor: 'pointer',
              bgcolor: '#EDE9FE',
              px: 1.5,
              py: 0.6,
              borderRadius: 10,
              WebkitTapHighlightColor: 'transparent',
              '&:active': { bgcolor: '#DDD6FE' },
              transition: 'background 0.15s',
            }}
          >
            See All
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(124,58,237,0.07)',
            border: '1px solid rgba(124,58,237,0.06)',
            marginBottom: '40px'
          }}
        >
          {top5Customers?.map((c, idx) => (
            <Box
              key={c.SrNo}
              onClick={() => router.push(`/customer/${c.id}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderBottom: idx < newCustomers.length - 1 ? '1px solid rgba(124,58,237,0.07)' : 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s',
                '&:active': { bgcolor: '#F5F3FF' },
              }}
            >
              <Avatar sx={{ width: 42, height: 42, bgcolor: '#7C3AED', fontSize: 15, fontWeight: 700 }}>
                {c.initial}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.FLname}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{c.email1}</Typography>
              </Box>
              <Chip
                label="New"
                size="small"
                sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, fontSize: 11, height: 22, '& .MuiChip-label': { px: 1 } }}
              />
              <ChevronRight size={16} color="#9CA3AF" />
            </Box>
          ))}
        </Box>
      </Box>
      <BottomNav />
    </Box>
  );
}