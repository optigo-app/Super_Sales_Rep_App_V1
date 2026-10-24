'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Chip, CardContent } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

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




const PolarArea = dynamic(
    () => import('react-chartjs-2').then((mod) => mod.PolarArea),
    { ssr: false }
);


export default function categorySale(props) {
    const router = useRouter();
    const { labelColor, borderColor, legendColor } = props;
    const [categorySaleData, setCategorySaleData] = useState([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const storedCategorySaleData = JSON.parse(
                    sessionStorage.getItem("dashboardData")
                );

                if (storedCategorySaleData && storedCategorySaleData !== "undefined") {
                    setCategorySaleData(storedCategorySaleData?.category || []);
                }
            } catch (error) {
                console.error("Error parsing JSON from sessionStorage:", error);
            }
        }
    }, []);

    const dataPolar = {
        labels: categorySaleData.map((item) => item.Category),
        datasets: [
            {
                data: categorySaleData.map((item) => item.SaleAmount),
                backgroundColor: [
                    "#FF5733", // Red
                    "#33FF57", // Green
                    "#3357FF", // Blue
                    "#FF33A1", // Pink
                    "#FF9633", // Orange
                ],
                borderWidth: 1,
            },
        ],
    };
    const optionsPolar = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                grid: {
                    display: false, // Hides the circular grid lines
                },
                angleLines: {
                    display: false, // Hides the radial lines
                },
                ticks: {
                    display: false, // Hides the tick marks
                },
                pointLabels: {
                    display: true, // Keep point labels visible
                    color: labelColor,
                },
                pointLabels: {
                    display: false, // Show the labels
                    color: labelColor,
                },
            },
        },
        plugins: {
            legend: {
                position: "right",
                align: "end",
                labels: {
                    padding: 25,
                    boxWidth: 9,
                    color: legendColor,
                    usePointStyle: true
                }
            },
        },
    };

    return (
        <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
            <Box sx={{ px: 2, pt: 1.5, pb: '80px' }}>
                {/* Back + Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box onClick={() => router.back()} sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(124,58,237,0.1)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', '&:active': { transform: 'scale(0.9)' }, transition: 'transform 0.15s' }}>
                        <ArrowLeft size={18} color="#1F2937" />
                    </Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Category Sale</Typography>
                </Box>

                <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '10px 0px 0px 10px' }}>
                    <div>
                        <p className="infoBox2_title">Category Wise Sale Overview</p>
                        <CardContent>
                            <PolarArea data={dataPolar} height={250} options={optionsPolar} />
                        </CardContent>
                    </div>
                </div>
            </Box>
        </Box>
    );
}
