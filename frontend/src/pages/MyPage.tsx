import React, { useState, useEffect } from 'react';
import { complaintsAPI, usersAPI } from '../utils/api';

function MyPage() {
    const [myReports, setMyReports] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', addr: '', phone: '' });
    const [isChangingPw, setIsChangingPw] = useState(false);
    const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const getStatusText = (status: string) => {
        switch (status) {
            case 'UNPROCESSED': return '접수완료';
            case 'IN_PROGRESS': return '처리중';
            case 'COMPLETED': return '처리완료';
            case 'REJECTED': return '반려';
            case 'CANCELLED': return '취소';
            default: return status;
        }
    };

    useEffect(() => {
        // 민원 목록 가져오기
        complaintsAPI.getMyComplaints()
            .then(data => setMyReports(data))
            .catch(err => console.error(err));

        // 사용자 정보 가져오기
        usersAPI.getMe()
            .then(data => {
                setUserInfo(data);
                setEditData({ name: data.name, addr: data.addr || '', phone: data.phone || '' });
            })
            .catch(err => console.error(err));
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await usersAPI.updateProfile(editData);
            alert('정보가 수정되었습니다.');
            setIsEditing(false);
            // 정보 갱신
            const updated = await usersAPI.getMe();
            setUserInfo(updated);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwData.newPassword !== pwData.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        try {
            await usersAPI.updatePassword({
                currentPassword: pwData.currentPassword,
                newPassword: pwData.newPassword
            });
            alert('비밀번호가 변경되었습니다.');
            setIsChangingPw(false);
            setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('정말로 탈퇴하시겠습니까? 작성하신 모든 데이터가 삭제될 수 있습니다.')) {
            try {
                await usersAPI.deleteAccount();
                alert('탈퇴 처리가 완료되었습니다.');
                localStorage.clear();
                window.location.href = '/';
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const statsCards = [
        { label: '전 체', count: myReports.length, color: '#F1F5F9', textColor: '#334155' },
        { label: '접 수', count: myReports.filter(r => r.status === 'UNPROCESSED').length, color: '#EFF6FF', textColor: '#2563EB' },
        { label: '처리중', count: myReports.filter(r => r.status === 'IN_PROGRESS').length, color: '#FEF2F2', textColor: '#EF4444' },
        { label: '처리완료', count: myReports.filter(r => r.status === 'COMPLETED').length, color: '#F0FDF4', textColor: '#16A34A' }
    ];

    return (
        <div className="mypage" style={{ padding: '60px 0', backgroundColor: '#F0F2F5', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
                {/* Header Section */}
                <div style={{ marginBottom: '40px', textAlign: 'left' }}>
                    <h2 style={{ color: '#1E293B', fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>마이페이지</h2>
                    <p style={{ color: '#64748B', fontSize: '1.1rem' }}>내 활동 현황과 회원 정보를 관리할 수 있습니다.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
                    {/* Left: Profile Card */}
                    <aside style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-color)',
                                color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto 15px',
                                boxShadow: '0 8px 16px rgba(63, 81, 181, 0.2)'
                            }}>
                                {userInfo?.name?.charAt(0) || 'U'}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1E293B', marginBottom: '5px' }}>{userInfo?.name}</h3>
                            <span style={{ fontSize: '0.9rem', color: '#94A3B8', backgroundColor: '#F1F5F9', padding: '4px 12px', borderRadius: '20px' }}>@{userInfo?.userId}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={iconBoxStyle}><LocationIcon /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={labelStyle}>주소</div>
                                    <div style={valueStyle}>{userInfo?.addr || '미등록'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={iconBoxStyle}><PhoneIcon /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={labelStyle}>연락처</div>
                                    <div style={valueStyle}>{userInfo?.phone || '미등록'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => setIsEditing(true)} style={actionButtonStyle}>정보 수정</button>
                            <button onClick={() => setIsChangingPw(true)} style={actionButtonStyle}>비밀번호 변경</button>
                            <button onClick={handleDeleteAccount} style={{ ...actionButtonStyle, color: '#EF4444', border: '1px solid #FEE2E2' }}>회원 탈퇴</button>
                        </div>
                    </aside>

                    {/* Right: Stats and List */}
                    <main style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* Stats Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            {statsCards.map((stat, idx) => (
                                <div key={idx} style={{
                                    backgroundColor: stat.color, padding: '30px', borderRadius: '12px',
                                    textAlign: 'center', border: '1px solid #E2E8F0'
                                }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: '600', color: '#64748B' }}>{stat.label}</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: stat.textColor }}>{stat.count}</div>
                                </div>
                            ))}
                        </div>

                        {/* Reports List */}
                        <section style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>나의 민원 목록</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '15px' }}>접수번호</th>
                                            <th style={{ padding: '15px' }}>제목</th>
                                            <th style={{ padding: '15px' }}>지역</th>
                                            <th style={{ padding: '15px' }}>신고일</th>
                                            <th style={{ padding: '15px' }}>상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myReports && myReports.length > 0 ? myReports.map((report) => (
                                            <tr key={report.complaintNo} style={{ textAlign: 'center', borderBottom: '1px solid #EEE' }}>
                                                <td style={{ padding: '15px' }}>{report.complaintNo}</td>
                                                <td style={{ padding: '15px', textAlign: 'left' }}>{report.title}</td>
                                                <td style={{ padding: '15px' }}>{report.address}</td>
                                                <td style={{ padding: '15px' }}>{new Date(report.createdDate).toLocaleDateString()}</td>
                                                <td style={{ padding: '15px', color: report.status === 'IN_PROGRESS' ? '#EF4444' : (report.status === 'COMPLETED' ? '#16A34A' : '#2563EB'), fontWeight: 'bold' }}>
                                                    {getStatusText(report.status)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#AAA' }}>내역이 없습니다.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {/* Modals remain similarly structured but with updated Styles below */}
            {isEditing && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: '25px', fontWeight: '800', fontSize: '1.5rem' }}>회원 정보 수정</h3>
                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={inputGroupStyle}>
                                <label style={inputLabelStyle}>이름</label>
                                <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} required style={inputStyle} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={inputLabelStyle}>주소</label>
                                <input type="text" value={editData.addr} onChange={e => setEditData({ ...editData, addr: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={inputLabelStyle}>연락처</label>
                                <input type="text" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={primaryButtonStyle}>저장하기</button>
                                <button type="button" onClick={() => setIsEditing(false)} style={secondaryButtonStyle}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isChangingPw && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: '25px', fontWeight: '800', fontSize: '1.5rem' }}>비밀번호 변경</h3>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={inputGroupStyle}>
                                <label style={inputLabelStyle}>현재 비밀번호</label>
                                <input type="password" value={pwData.currentPassword} onChange={e => setPwData({ ...pwData, currentPassword: e.target.value })} required style={inputStyle} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={inputLabelStyle}>새 비밀번호</label>
                                <input type="password" value={pwData.newPassword} onChange={e => setPwData({ ...pwData, newPassword: e.target.value })} required style={inputStyle} />
                            </div>
                            <div style={inputGroupStyle}>
                                <label style={inputLabelStyle}>비밀번호 확인</label>
                                <input type="password" value={pwData.confirmPassword} onChange={e => setPwData({ ...pwData, confirmPassword: e.target.value })} required style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={primaryButtonStyle}>변경하기</button>
                                <button type="button" onClick={() => setIsChangingPw(false)} style={secondaryButtonStyle}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styled Icons and Helpers
const LocationIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

// Style Constants
const iconBoxStyle = {
    width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F1F5F9',
    display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary-color)'
};
const labelStyle = { fontSize: '0.8rem', color: '#94A3B8', fontWeight: '600' };
const valueStyle = { fontSize: '1rem', color: '#1E293B', fontWeight: '500' };
const actionButtonStyle = {
    padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'transparent',
    color: '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
};
const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white', padding: '40px', borderRadius: '24px', width: '450px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};
const inputGroupStyle = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const inputLabelStyle = { fontSize: '0.9rem', fontWeight: '600', color: '#475569' };
const inputStyle = {
    padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '1rem',
    outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#F8FAFC'
};
const primaryButtonStyle = {
    padding: '14px', borderRadius: '12px', backgroundColor: 'var(--primary-color)', color: 'white',
    border: 'none', fontWeight: '700', cursor: 'pointer', flex: 1
};
const secondaryButtonStyle = {
    padding: '14px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#475569',
    border: 'none', fontWeight: '700', cursor: 'pointer', flex: 1
};

export default MyPage;
