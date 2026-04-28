'use client';

import { Box, Typography, Avatar } from '@mui/material';
import { LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header({ rightContent }) {

  const router = useRouter();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        bgcolor: '#F5F3FF',
        borderBottom: '1px solid rgba(124,58,237,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <LayoutGrid size={18} color="#fff" strokeWidth={2.2} />
        </Box>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 800,
            color: '#7C3AED',
            letterSpacing: '-0.3px',
          }}
        >
          Super Sales
        </Typography>
      </Box>

      {rightContent !== undefined ? (
        rightContent
      ) : (
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#7C3AED',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            '&:active': { transform: 'scale(0.9)' },
            transition: 'transform 0.15s',
          }}
          onClick={() => router.push('/profile')}
        >
          E
        </Avatar>
      )}
    </Box>
  );
}