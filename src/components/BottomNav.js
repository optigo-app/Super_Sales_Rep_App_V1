'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { Home, Users, Grid2X2, Tag, BookImage } from 'lucide-react';

const navItems = [
  { label: 'Home',       icon: Home,     path: '/'       },
  { label: 'Customer',   icon: Users,    path: '/customer'   },
  { label: 'Tag Info',   icon: Grid2X2,    path: '/taginfo'   },
  { label: 'Catalog', icon: BookImage ,  path: '/cateloging' },
  { label: 'MRPBill',    icon: Tag,      path: '/MRPBill'    },
];

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <>
      {/* Blur backdrop — full width, sits at the very bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '18px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'linear-gradient(to top, rgba(245,243,255,0.92) 60%, rgba(245,243,255,0))',
          zIndex: 999,
          pointerEvents: 'none',
        }}
      />

      {/* The floating pill nav */}
      <Box
        sx={{
          position: 'fixed',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: 480,
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.12)',
          boxShadow: '0 8px 32px rgba(124,58,237,0.15), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 1000,
          borderRadius: '28px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 0.5,
        }}
      >
        {navItems.map(({ label, icon: Icon, path }) => {
          const active =
            pathname === path ||
            (path !== '/home' && pathname.startsWith(path + '/'));

          return (
            <Box
              key={path}
              onClick={() => router.push(path)}
              sx={{
                flex: 1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '4px',
                height:         52,
                borderRadius:   '18px',
                bgcolor: active ? '#7C3AED' : 'transparent',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                transition: 'background 0.22s ease, transform 0.15s ease',
                boxShadow: active ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
                '&:active': { transform: 'scale(0.92)' },
              }}
            >
              <Icon
                size={22}
                color={active ? '#fff' : '#9CA3AF'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <Typography
                sx={{
                  fontSize:      11,
                  fontWeight:    active ? 700 : 500,
                  color:         active ? '#fff' : '#9CA3AF',
                  lineHeight:    1,
                  letterSpacing: active ? '0.3px' : 0,
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </>
  );
}