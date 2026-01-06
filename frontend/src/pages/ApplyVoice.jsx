import React, { useState, useRef } from 'react';
import axios from 'axios';

function ApplyVoice() {
    // State management
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const sidebarItemStyle = { marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '0.9rem' };

    // Format time (seconds -> MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress bar percentage (max 5 minutes = 300 seconds)
    const progressPercentage = Math.min((recordingTime / 300) * 100, 100);

    // Start Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                handleAnalyze(blob); // Auto analyze on stop
            };

            mediaRecorder.start();
            setIsRecording(true);
            setAnalysisResult(null); // Clear previous results

            // Start Timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("마이크 접근 권한이 필요합니다.");
        }
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);

            // Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    // Send to Server
    const handleAnalyze = async (blob) => {
        setIsLoading(true);
        const formData = new FormData();
        // Create a file with a proper name and extension
        const file = new File([blob], "voice_record.wav", { type: "audio/wav" });
        formData.append('file', file);

        try {
            // Updated API endpoint to match Nginx proxy
            const response = await axios.post('/api/stt/upload_voice', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log("Analysis Result:", response.data);
            setAnalysisResult(response.data);
            alert("분석이 완료되었습니다!"); // Alert as requested

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("분석 중 오류가 발생했습니다: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="apply-voice-page" style={{ padding: '40px 0' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1.2fr', gap: '30px' }}>
                {/* Left Sidebar Steps */}
                <div style={{ backgroundColor: '#F9F9F9', padding: '30px', borderRadius: '8px' }}>
                    <div style={sidebarItemStyle}>민원 제목 <span style={{ color: 'red' }}>✓</span></div>
                    <div style={{ ...sidebarItemStyle, fontWeight: 'bold', color: 'var(--primary-color)' }}>음성 인식 <span style={{ color: 'red' }}>✓</span></div>
                    <div style={{ ...sidebarItemStyle, marginTop: '350px' }}>신고 내용 공유 여부 <span style={{ color: '#DDD' }}>✓</span></div>
                    <div style={sidebarItemStyle}>개인정보 동의 여부 <span style={{ color: '#DDD' }}>✓</span></div>
                </div>

                {/* Center Main Form */}
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                        통합 민원 신청 (음성)
                    </div>
                    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        {/* Title Input (Auto-filled or Manual) */}
                        <input
                            type="text"
                            placeholder="민원 제목 (자동 생성됨)"
                            value={analysisResult ? analysisResult.title : ''}
                            readOnly
                            style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '4px', marginBottom: '40px', backgroundColor: '#F5F5F5' }}
                        />

                        {/* Microphone Button */}
                        <div
                            onClick={isRecording ? stopRecording : startRecording}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                border: `4px solid ${isRecording ? '#FF4B4B' : 'var(--primary-color)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '30px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                backgroundColor: isRecording ? '#FFE5E5' : 'white',
                                boxShadow: isRecording ? '0 0 15px rgba(255, 75, 75, 0.5)' : 'none'
                            }}>
                            {isLoading ? (
                                <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                            ) : (
                                <svg width="60" height="60" viewBox="0 0 24 24" fill={isRecording ? '#FF4B4B' : 'var(--primary-color)'}>
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                            )}
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                            {isRecording ? "녹음 중... (클릭하여 중지)" : (isLoading ? "분석 중..." : "마이크 아이콘을 눌러 녹음을 시작하세요")}
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', backgroundColor: '#EEE', height: '30px', borderRadius: '15px', position: 'relative', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: isRecording ? '#FF4B4B' : 'var(--primary-color)', transition: 'width 0.5s linear' }}></div>
                            <div style={{ position: 'absolute', top: '0', left: '10px', height: '100%', display: 'flex', alignItems: 'center', color: progressPercentage > 10 ? 'white' : '#555', fontSize: '0.8rem', zIndex: 1 }}>
                                {formatTime(recordingTime)}
                            </div>
                            <div style={{ position: 'absolute', top: '0', right: '10px', height: '100%', display: 'flex', alignItems: 'center', color: '#555', fontSize: '0.8rem' }}>5:00</div>
                        </div>

                        <div style={{ width: '100%', marginBottom: '20px', marginTop: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>발생 위치</span>
                                <button style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>위치 찾기</button>
                            </div>
                            <div style={{ width: '100%', height: '180px', backgroundColor: '#EEE', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {/* Placeholder Map Image */}
                                <img src="https://via.placeholder.com/600x200?text=Map+Placeholder" alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>

                        <div style={{ width: '100%', display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <label><input type="radio" name="share" defaultChecked /> 공개</label>
                            <label><input type="radio" name="share" /> 비공개</label>
                        </div>
                        <div style={{ width: '100%', display: 'flex', gap: '20px' }}>
                            <label><input type="radio" name="agree" defaultChecked /> 동의</label>
                            <label><input type="radio" name="agree" /> 비동의</label>
                        </div>
                    </div>
                </div>

                {/* Right AI Analysis (Dynamic Data) */}
                <div style={{ background: 'linear-gradient(to bottom, #7C3AED, #60A5FA)', borderRadius: '12px', padding: '2px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', height: '100%', padding: '20px' }}>
                        <h3 style={{ textAlign: 'center', color: '#4F46E5', marginBottom: '20px' }}>AI 분석결과</h3>

                        {analysisResult ? (
                            <>
                                <div style={{ padding: '15px', backgroundColor: '#EEF2FF', borderRadius: '8px', marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6366F1', marginBottom: '5px' }}>민원 유형 AI 결과</div>
                                    <div style={{ fontWeight: 'bold', textAlign: 'center' }}>유형: <span style={{ color: '#4F46E5', fontSize: '1.1rem' }}>{analysisResult.category}</span></div>
                                </div>
                                <div style={{ padding: '15px', backgroundColor: '#EEF2FF', borderRadius: '8px', marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6366F1', marginBottom: '5px' }}>처리 기관 AI 분류 결과</div>
                                    <div style={{ fontWeight: 'bold', textAlign: 'center' }}>처리기관: <span style={{ color: '#4F46E5', fontSize: '1.2rem' }}>{analysisResult.agency}</span></div>
                                </div>
                                <div style={{ padding: '15px', backgroundColor: '#EEF2FF', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6366F1', marginBottom: '5px' }}>음성 인식 결과</div>
                                    <div style={{ textAlign: 'center' }}>
                                        {/* <div style={{ fontSize: '0.85rem', color: '#312E81', marginBottom: '5px' }}>발생지점</div>
                                        <div style={{ fontSize: '0.8rem', marginBottom: '10px' }}>서울 강남구 남부순환로365길 33</div> */}
                                        <div style={{ fontSize: '0.85rem', color: '#312E81', marginBottom: '5px', marginTop: '10px' }}>민원 내용</div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{analysisResult.original_text}</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#AAA', paddingTop: '50px' }}>
                                <p>음성 녹음 후<br />분석 결과가 여기에 표시됩니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default ApplyVoice;
