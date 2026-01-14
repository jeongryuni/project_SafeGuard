import React, { useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

interface ChartOneProps {
    selectedCategory: string;
}

const ComplaintTrendChart: React.FC<ChartOneProps> = ({ selectedCategory }) => {
    // 지표 표시 상태 관리
    const [visibility, setVisibility] = useState({
        received: true,
        completed: true,
        growth: true
    });

    // 데이터 생성 로직
    const getCategoryData = (name: string) => {
        const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return Array.from({ length: 10 }, (_, i) => Math.floor(Math.abs(Math.sin(seed + i)) * 100));
    };

    const receivedData = useMemo(() => getCategoryData(selectedCategory), [selectedCategory]);
    const completedData = useMemo(() => getCategoryData(selectedCategory + 'done').map(v => Math.floor(v * 0.7)), [selectedCategory]);

    // 증감률 계산 (전일 대비 % - 시연용으로 변동성 있게 계산)
    const growthData = useMemo(() => {
        return receivedData.map((val, i) => {
            if (i === 0) return 0;
            const prev = receivedData[i - 1];
            if (prev === 0) return 0;
            return parseFloat(((val - prev) / prev * 100).toFixed(1));
        });
    }, [receivedData]);

    const series = [
        ...(visibility.received ? [{ name: `${selectedCategory} 접수`, data: receivedData, type: 'area' }] : []),
        ...(visibility.completed ? [{ name: `${selectedCategory} 완료`, data: completedData, type: 'area' }] : []),
        ...(visibility.growth ? [{ name: `증감률 (%)`, data: growthData, type: 'line' }] : []),
    ];

    const options = {
        legend: { show: false },
        colors: ['#3B82F6', '#10B981', '#EF4444'],
        chart: {
            fontFamily: 'Pretendard, sans-serif',
            height: 350,
            type: 'line' as const,
            dropShadow: { enabled: true, color: '#623CEA14', top: 10, blur: 4, left: 0, opacity: 0.1 },
            toolbar: { show: false },
        },
        stroke: {
            width: visibility.growth ? [3, 3, 4] : [3, 3],
            curve: 'smooth' as const,
            dashArray: [0, 0, 5] // 증감률은 점선으로 표현하여 구분감 부여
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100, 100, 100],
                // 각 시리즈별 그라데이션 색상을 명시적으로 제어 (Recharts와 달리 ApexCharts는 colors 배열을 따름)
            }
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } }
        },
        dataLabels: { enabled: false },
        markers: {
            size: 5,
            colors: '#fff',
            strokeColors: ['#3B82F6', '#10B981', '#EF4444'],
            strokeWidth: 3,
            hover: { size: 8 }
        },
        xaxis: {
            type: 'category' as const,
            categories: ['12/25', '12/26', '12/27', '12/28', '12/29', '12/30', '12/31', '01/01', '01/02', '01/03'],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#64748B', fontWeight: 700 } }
        },
        yaxis: [
            {
                show: visibility.received || visibility.completed,
                title: { text: '접수/완료 건수', style: { color: '#64748B', fontWeight: 800 } },
                labels: { style: { colors: '#64748B', fontWeight: 700 } }
            },
            {
                opposite: true,
                show: visibility.growth,
                title: { text: '증감률 (%)', style: { color: '#EF4444', fontWeight: 800 } },
                labels: { style: { colors: '#EF4444', fontWeight: 700 } }
            }
        ],
        tooltip: {
            theme: 'light',
            shared: true,
            intersect: false,
            y: {
                formatter: (val: number, { seriesIndex }: any) => {
                    // 데이터 값 출력시 증감률은 %로 표시
                    const isGrowthIndex = visibility.growth && seriesIndex === series.length - 1;
                    if (isGrowthIndex) {
                        return `${val}%`;
                    }
                    return `${val} 건`;
                }
            }
        }
    };

    const toggleSeries = (key: keyof typeof visibility) => {
        setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="w-full" style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '4px', height: '24px', backgroundColor: '#3B82F6', borderRadius: '2px', marginRight: '12px' }}></div>
                <h5 style={{ fontSize: '20px', fontWeight: '950', color: '#1e293b' }}>
                    [{selectedCategory}] 상세 분석 및 트렌드
                </h5>
            </div>

            <div style={{ flex: 1, minHeight: '350px' }}>
                <ReactApexChart options={options as any} series={series} type="line" height={350} />
            </div>

            {/* Custom Interactive Legend / Filters */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                <button
                    onClick={() => toggleSeries('received')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', background: 'none',
                        opacity: visibility.received ? 1 : 0.4, transition: 'all 0.2s'
                    }}
                >
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {visibility.received && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '1px' }}></div>}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>접수 건수</span>
                </button>

                <button
                    onClick={() => toggleSeries('completed')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', background: 'none',
                        opacity: visibility.completed ? 1 : 0.4, transition: 'all 0.2s'
                    }}
                >
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {visibility.completed && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '1px' }}></div>}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>완료 건수</span>
                </button>

                <button
                    onClick={() => toggleSeries('growth')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', background: 'none',
                        opacity: visibility.growth ? 1 : 0.4, transition: 'all 0.2s'
                    }}
                >
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {visibility.growth && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '1px' }}></div>}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>증감률 (%)</span>
                </button>
            </div>
        </div>
    );
};

export default ComplaintTrendChart;
