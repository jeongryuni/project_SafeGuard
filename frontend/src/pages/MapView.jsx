import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../utils/api';

function MapView() {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats for summary bar
    const summary = {
        total: locations.length,
        traffic: locations.filter(l => l.category === '교통').length,
        safety: locations.filter(l => l.category === '안전').length,
        admin: locations.filter(l => l.category === '행정·안전').length,
        other: locations.filter(l => !['교통', '안전', '행정·안전'].includes(l.category)).length,
    };

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await complaintsAPI.getMapLocations();
                setLocations(data);
            } catch (err) {
                console.error('위치 데이터 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        const loadKakaoMap = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    const container = mapRef.current;
                    const options = {
                        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                        level: 7
                    };
                    const newMap = new window.kakao.maps.Map(container, options);
                    setMap(newMap);
                });
            }
        };

        const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
        if (kakaoKey) {
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=services,clusterer`;
            script.async = true;
            script.onload = loadKakaoMap;
            document.head.appendChild(script);
            return () => document.head.removeChild(script);
        }
    }, []);

    useEffect(() => {
        if (!map || locations.length === 0) return;

        const clusterer = new window.kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 5,
            styles: [{
                width: '53px', height: '52px',
                background: 'rgba(51, 204, 153, 0.8)',
                borderRadius: '50%',
                color: '#fff',
                textAlign: 'center',
                fontWeight: 'bold',
                lineHeight: '51px'
            }]
        });

        const markers = locations.map(loc => {
            const marker = new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(loc.lat, loc.lng)
            });
            window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelectedComplaint(loc);
                // Center map on click
                map.panTo(new window.kakao.maps.LatLng(loc.lat, loc.lng));
            });
            return marker;
        });

        clusterer.addMarkers(markers);
    }, [map, locations]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'RECEIVED': return { text: '접수', color: '#3b82f6', bg: '#eff6ff' };
            case 'IN_PROGRESS': return { text: '처리중', color: '#f59e0b', bg: '#fffbeb' };
            case 'COMPLETED': return { text: '완료', color: '#10b981', bg: '#f0fdf4' };
            default: return { text: status, color: '#64748b', bg: '#f1f5f9' };
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7fa' }}>
            {/* Summary Bar */}
            <div style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: 'white'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4f46e5', margin: 0 }}>신고현황 지도</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#4f46e5', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        <span>📊 {summary.total} 건</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        <span style={{ color: '#ef4444' }}>🔴</span> <span>{summary.traffic}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        <span style={{ color: '#f59e0b' }}>🟡</span> <span>{summary.admin}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        <span style={{ color: '#10b981' }}>🟢</span> <span>{summary.safety}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        <span style={{ color: '#3b82f6' }}>🔵</span> <span>{summary.other}</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="내용, 위치로 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '240px' }}
                    />
                    <button style={{ padding: '8px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>검색</button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Map Section */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                            <div className="spinner"></div>
                        </div>
                    )}
                </div>

                {/* Sidebar Section */}
                <div style={{ width: '400px', backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>접수 목록</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>전체 {locations.length} 건</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {locations.map((loc) => (
                            <div
                                key={loc.complaintNo}
                                onClick={() => setSelectedComplaint(loc)}
                                style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: selectedComplaint?.complaintNo === loc.complaintNo ? '2px solid #4f46e5' : '1px solid #f1f5f9',
                                    backgroundColor: selectedComplaint?.complaintNo === loc.complaintNo ? '#f5f7ff' : 'white',
                                    marginBottom: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b' }}>2024-{String(loc.complaintNo).padStart(4, '0')}</span>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '600' }}>{loc.category}</span>
                                </div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>{loc.title}</h3>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        color: getStatusStyle(loc.status).color,
                                        backgroundColor: getStatusStyle(loc.status).bg
                                    }}>
                                        {getStatusStyle(loc.status).text}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>D-1 기한</span>
                                </div>

                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                                    <div style={{ marginBottom: '4px' }}>🕑 기한: 04-27</div>
                                    <div>📍 지차: {loc.address?.split(' ')[0]}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MapView;
