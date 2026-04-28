'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { ArrowLeft, User, Phone, Mail, Building2, BadgeCheck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

function InfoRow({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderBottom: '1px solid #F3F4F6',
                bgcolor: '#fff',
            }}
        >
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    bgcolor: '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon size={16} color="#7C3AED" strokeWidth={2.2} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#1F2937', fontWeight: 600, mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [spVer, setSpVer] = useState('');
    const [appVer, setAppVer] = useState('');

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const raw = sessionStorage.getItem('dashboardData');
                if (raw) {
                    const data = JSON.parse(raw);
                    setUser(data?.userData?.rd[0]);
                }

                setSpVer(sessionStorage.getItem("SpVer") || '');
                setAppVer(sessionStorage.getItem("AppVer") || '');
            } catch (e) {
                console.error('Failed to parse sessionStorage', e);
            }
        }
    }, []);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('dashboardData');
            if (raw) {
                const data = JSON.parse(raw);
                setUser(data?.userData?.rd[0]);
            }
        } catch (e) {
            console.error('Failed to parse dashboardData', e);
        }
    }, []);

    const name = user?.UserName || user?.Name || user?.FLname || user?.EmployeeName || 'User';
    const email = user?.Email || user?.email1 || user?.EmailId || '';
    const phone = user?.MobileNo || user?.mobileno || user?.PhoneNo || '';
    const company = user?.CompanyCode || user?.Firmname || user?.Company || '';
    const role = user?.RoleName || user?.Designation || user?.UserType || '';
    const empCode = user?.customercode || user?.EmployeeCode || user?.UserId || '';
    const initial = name.charAt(0).toUpperCase();

    const handleLogout = () => {
        sessionStorage.clear();
        router.replace('/login');
    };

    return (
        <Box sx={{ bgcolor: '#F5F3FF', minHeight: '100vh' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
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
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>My Profile</Typography>
            </Box>

            <Box sx={{ pb: '40px' }}>
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #9F7AEA 100%)',
                        px: 2,
                        pt: 3,
                        pb: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Avatar
                        sx={{
                            width: 78,
                            height: 78,
                            bgcolor: 'rgba(255,255,255,0.22)',
                            fontSize: 30,
                            fontWeight: 800,
                            color: '#fff',
                            border: '3px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                        }}
                    >
                        {initial}
                    </Avatar>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>
                            {name}
                        </Typography>
                        {role && (
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mt: 0.5,
                                    px: 1.5,
                                    py: 0.4,
                                    borderRadius: 10,
                                    bgcolor: 'rgba(255,255,255,0.18)',
                                }}
                            >
                                <BadgeCheck size={12} color="rgba(255,255,255,0.9)" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600 }}>
                                    {role}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Card pulled up over banner */}
                <Box sx={{ px: 2, mt: -3 }}>
                    <Box
                        sx={{
                            bgcolor: '#fff',
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 4px 24px rgba(124,58,237,0.12)',
                            border: '1px solid rgba(124,58,237,0.06)',
                        }}
                    >
                        <Box sx={{ px: 2, py: 1, bgcolor: '#F5F3FF' }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                                Contact Details
                            </Typography>
                        </Box>

                        <InfoRow icon={Phone} label="Mobile" value={phone} />
                        <InfoRow icon={Mail} label="Email" value={email} />
                        <InfoRow icon={Building2} label="Company" value={company} />
                        <InfoRow icon={User} label="Emp. Code" value={empCode} />
                    </Box>
                </Box>

                {/* Logout */}
                <Box sx={{ px: 2, mt: 3 }}>
                    <Box
                        onClick={handleLogout}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            bgcolor: '#FEF2F2',
                            border: '1.5px solid #FECACA',
                            borderRadius: 2.5,
                            py: 1.75,
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            '&:active': { transform: 'scale(0.98)', bgcolor: '#FEE2E2' },
                            transition: 'all 0.15s',
                        }}
                    >
                        <LogOut size={18} color="#EF4444" strokeWidth={2.2} />
                        <Typography sx={{ color: '#EF4444', fontSize: 15, fontWeight: 700 }}>
                            Logout
                        </Typography>
                    </Box>
                </Box>

                <div style={{ display: 'flex', color: 'lightgray', justifyContent: 'center', marginTop: '70px', fontSize: '16px' }}>
                    <p>Version :</p><p style={{ margin: "0px 0px 0px 5px" }}>{appVer}</p>
                    <p style={{ fontSize: '13px', display: 'flex', alignItems: 'flex-end' }}>({spVer})</p>
                </div>
            </Box>
        </Box>
    );
}