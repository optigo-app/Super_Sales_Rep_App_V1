// http://supersalesrep.web/V1/?token=0L8P5VSN38J59LXA&SV=0&SV=0&SpVer=V1&AppVer=1.0.0
// http://localhost:6008/V1/?token=250NISIKUN3J2610&SV=0&version=R50B3&SV=0&SpVer=V1&yearCode=e3tuemVufX17ezIwfX17e29yYWlsMjV9fXt7b3JhaWwyNX19&AppVer=1.0.0
// http://localhost:7500/V1/?token=YA3N0MD76S657DCR&SV=0&version=R50B3&SV=0&SpVer=V1&yearCode=e3tuemVufX17ezIwfX17e2RlbW9zdG9yZX19e3tkZW1vc3RvcmV9fQ==&AppVer=1.0.0 demostore
// https://nxt01.optigoapps.com/V1/?token=IGQ6NSF7QW6QA78N&SV=1&SV=1&SpVer=V1&yearCode=e3tsaXZlNi5vcHRpZ29hcHBzLmNvbX19e3syMH19e3t0ZXN0NzdhfX17e3Rlc3Q3N2F9fQ==&AppVer=1.0.0

'use client';

import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { CommonAPImain } from '@/Utils/API/CommonAPImain/CommonAPImain';
import LoadingBackdrop from '@/Utils/LoadingBackdrop';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import {
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  if (value >= 100000) return `Amt ${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `Amt ${(value / 1000).toFixed(1)}K`;
  return `Amt ${value}`;
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
    }
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
    const yearCode = queryParams.get("yearCode");
    const AppVer = queryParams.get("AppVer");
    const version = queryParams.get("version");

    if (SV && token_url && AppVer) {
      sessionStorage.setItem("token", token_url ?? "");
      sessionStorage.setItem("SV", SV ?? "");
      sessionStorage.setItem("SpVer", SpVer ?? "");
      sessionStorage.setItem("version", version ?? "");
      sessionStorage.setItem("yearCode", yearCode ?? "");
      sessionStorage.setItem("AppVer", AppVer ?? "");
    }
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
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
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
                  '&:active': { transform: 'scale(0.96)', bgcolor: 'white' },
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
        {top5Customers?.length != 0 &&
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
        }

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
              onClick={() => {
                sessionStorage.setItem('selectedCustomer', JSON.stringify(c));
                router.push(`/customer/${c.CustomerId}`);
              }}
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
                '&:active': { bgcolor: 'white' },
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


// find . -mindepth 1 -delete

// supersalesrep.web - V1 - 6008 - 38
// npm run build && pm2 restart 38 && pm2 save 


// nxt01.optigoaps.com -  V1 - 7500 
// npm run build && pm2 restart 31 && pm2 save 