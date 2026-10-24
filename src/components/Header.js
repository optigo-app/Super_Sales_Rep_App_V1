'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Menu as MenuIcon, User, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header({ rightContent }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const initial = user?.ImagePath ?? (user?.Name ? user.Name.charAt(0).toUpperCase() : null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem('dashboardData');
        if (raw) {
          const data = JSON.parse(raw);
          setUser(data?.userData?.rd[0]);
        }
      } catch (e) {
        console.error('Failed to parse sessionStorage', e);
      }
    }
  }, [drawerOpen]);

  const menuItems = [
    { label: 'Profile', icon: <User size={20} color="#7C3AED" />, path: '/profile' },
    { label: 'Quick Task', icon: <Zap size={20} color="#7C3AED" />, path: '/QuickTask' },
    { label: 'Magic Catalog', icon: <Sparkles size={20} color="#7C3AED" />, path: '/magicCatalog' },
  ];

  const handleNavigate = (path) => {
    setDrawerOpen(false);
    router.push(path);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        bgcolor: 'white',
        borderBottom: '1px solid rgba(124,58,237,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        onClick={() => setDrawerOpen(true)}
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          '&:active': { transform: 'scale(0.9)' },
          transition: 'transform 0.15s',
          color: '#7C3AED',
        }}
      >
        <MenuIcon size={22} />
      </Box>

      <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <img
          src="/V1/mainLogo.png"
          alt="logo"
          style={{ height: 85, width: 'auto', objectFit: 'contain' }}
        />
      </Box>

      {rightContent !== undefined ? (
        rightContent
      ) : (
        <Avatar
          onClick={() => router.push('/profile')}
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#7C3AED',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            '&:active': { transform: 'scale(0.9)' },
            transition: 'transform 0.15s',
          }}
        >
          <User size={18} color="#fff" />
        </Avatar>
      )}

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, pt: 0 }} role="presentation">
          <Box
            sx={{
              px: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: '1px solid rgba(124,58,237,0.08)',
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.22)',
                fontSize: 30,
                fontWeight: 800,
                color: '#fff',
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              }}
              src={initial}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                borderBottom: '1px solid rgba(124,58,237,0.08)',
              }}
            >
              <Typography sx={{ fontWeight: 700, color: '#32353a', fontSize: '10px', width: '100%' }}>{user?.firstname || user?.Name} {user?.lastname || user?.Name}</Typography>
              <Typography sx={{ fontWeight: 700, color: '#32353a', fontSize: '9px', width: '100%' }}>{user?.UserID}</Typography>
            </Box>
          </Box>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton onClick={() => handleNavigate(item.path)} sx={{ py: 1.25 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
