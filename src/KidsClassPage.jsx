import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

const KidsClassPage = () => {
    // 폼 레퍼런스 (플로팅 버튼 스크롤용)
    const formRef = useRef(null);

    // 커리큘럼 아코디언 열림 상태
    const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);

    // 폼 상태 관리
    const [formData, setFormData] = useState({
        guardianName: '',
        phone: '',
        childName: '',
        childAge: '',
        allergyOrMessage: '',
        depositorName: '',
    });

    const handleCopyAccount = async () => {
        try {
            await navigator.clipboard.writeText('110-583-680821');
            alert('계좌번호가 복사되었습니다!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('복사에 실패했습니다. 직접 복사해주세요.');
        }
    };

    // 선택된 예약 시간
    const [preferredDateTime, setPreferredDateTime] = useState('');

    // 예약 현황 (시간대별 예약 수)
    const [slotCounts, setSlotCounts] = useState({});

    // 클래스 최대 정원
    const MAX_CAPACITY = 6;

    // 선택된 클래스 제품
    const [selectedClass, setSelectedClass] = useState(null);

    // 동의 여부
    const [isAgreed, setIsAgreed] = useState(false);

    // 제출 상태
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 현재 보고 있는 사람 수 상태
    const [viewerCount, setViewerCount] = useState(0);

    // 실시간 예약 현황 가져오기 및 현재 보고 있는 사람 수 계산
    useEffect(() => {
        // ... 기존 실시간 예약 현황 래퍼 ...
        const q = query(collection(db, "kids_class_reservations"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const counts = {};
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (data.status !== 'cancelled' && data.preferredDateTime) {
                    counts[data.preferredDateTime] = (counts[data.preferredDateTime] || 0) + 1;
                }
            });
            setSlotCounts(counts);
        }, (error) => {
            console.error("Firebase onSnapshot Error:", error);
        });

        // 실시간 보고 있는 사람 수 (시간대별 가중치 적용)
        const updateViewerCount = () => {
            const hour = new Date().getHours();
            let min, max;

            // 새벽/아침 (00:00 ~ 08:59): 1 ~ 5명
            if (hour >= 0 && hour < 9) {
                min = 1; max = 5;
            }
            // 밤 늦게 (22:00 ~ 23:59): 3 ~ 10명
            else if (hour >= 22) {
                min = 3; max = 10;
            }
            // 낮/저녁 피크 시간대 (09:00 ~ 21:59): 8 ~ 28명
            else {
                min = 8; max = 28;
            }

            const randomCount = Math.floor(Math.random() * (max - min + 1)) + min;
            setViewerCount(randomCount);
        };

        updateViewerCount(); // 초기 설정
        const viewerInterval = setInterval(updateViewerCount, 15000 + Math.random() * 10000); // 15~25초마다 변경

        // 컴포넌트 언마운트 시 구독 및 인터벌 해제
        return () => {
            unsubscribe();
            clearInterval(viewerInterval);
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // ... 기존 코드 유지 ...
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검사
        if (!selectedClass) {
            alert('클래스를 선택해주세요!');
            return;
        }

        if (!preferredDateTime) {
            alert('희망 예약 일시를 선택해주세요!');
            return;
        }

        if (!isAgreed) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        // 나이 유효성 검사
        const age = parseInt(formData.childAge, 10);
        if (isNaN(age) || age < 5 || age > 12) {
            alert('키즈 베이킹 클래스는 만 5세부터 만 12세까지 참여 가능합니다.');
            return;
        }

        // 예약 인원 더블 체크 방어 로직
        if ((slotCounts[preferredDateTime] || 0) >= MAX_CAPACITY) {
            alert('앗! 방금 선택하신 시간의 예약이 마감되었습니다. 다른 시간을 선택해 주세요.');
            setPreferredDateTime('');
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "kids_class_reservations"), {
                guardianName: formData.guardianName,
                phone: formData.phone,
                childName: formData.childName,
                childAge: age,
                preferredDateTime: preferredDateTime,
                allergyOrMessage: formData.allergyOrMessage,
                depositorName: formData.depositorName,
                selectedClass: selectedClass,
                agreed: isAgreed,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            alert('예약 신청이 접수되었습니다! 안내된 계좌로 입금해 주시면 입금 확인 후 최종 예약 확정 문자를 보내드립니다. 🍫');
            // 폼 초기화
            setFormData({
                guardianName: '',
                phone: '',
                childName: '',
                childAge: '',
                allergyOrMessage: '',
                depositorName: '',
            });
            setSelectedClass(null);
            setPreferredDateTime('');
            setIsAgreed(false);

        } catch (error) {
            console.error("Error adding document: ", error);
            alert('예약 중 오류가 발생했습니다. 다시 시도해 주시거나 전화로 문의해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50">
            {/* 메인 컨텐츠 컨테이너 (플로팅 버튼 공간 확보를 위해 pb-24 추가) */}
            <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 pb-24 relative">

                {/* 실시간 뷰어 카운터 바지 (스크롤 시에도 상단 중앙에 고정) */}
                {viewerCount > 0 && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-xl border border-white/20 whitespace-nowrap">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            현재 <span className="text-amber-300 mx-0.5">{viewerCount}명</span>이 보고 있어요 👀
                        </div>
                    </div>
                )}

                {/* 상단 비주얼 영역 */}
                <div className="flex flex-col items-center mb-10 text-center relative mt-4">

                    <img
                        src="/logo.png"
                        alt="베리굿초콜릿 로고"
                        className="h-16 md:h-20 object-contain mb-6 drop-shadow-sm"
                    />

                    <div className="w-full rounded-3xl overflow-hidden shadow-xl shadow-rose-200/50 mb-8 border-4 border-white">
                        <img
                            src="/cake-hero.webp"
                            alt="키즈 베이킹 클래스 포스터"
                            className="w-full h-auto object-cover aspect-[1000/1414] object-center"
                            onError={(e) => {
                                // 포스터 이미지가 없을 경우 대체 이미지나 영역 표시
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1557308536-ee471ef2c390?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                            }}
                        />
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-rose-100 w-full relative">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-400 text-white px-6 py-2 rounded-full font-bold shadow-md text-sm whitespace-nowrap">
                            👩‍🍳 달콤한 키즈 베이킹 클래스 👨‍🍳
                        </div>

                        {/* 1. 기본 정보 요약 */}
                        <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4 mb-8">
                            <div className="bg-rose-50/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center text-center border border-rose-100/50 justify-center">
                                <span className="text-xl md:text-2xl mb-1 md:mb-2">👧👦</span>
                                <span className="text-[10px] md:text-xs font-bold text-rose-400 mb-1">참여 대상</span>
                                <span className="text-xs md:text-sm font-bold text-amber-900 break-keep">만 5세 - 12세</span>
                            </div>
                            <div className="bg-amber-50/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center text-center border border-amber-100/50 justify-center">
                                <span className="text-xl md:text-2xl mb-1 md:mb-2">⏱️</span>
                                <span className="text-[10px] md:text-xs font-bold text-amber-500 mb-1">소요 시간</span>
                                <span className="text-xs md:text-sm font-bold text-amber-900 break-keep">약 90분</span>
                            </div>
                            <div className="bg-rose-50/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center text-center border border-rose-100/50 justify-center">
                                <span className="text-xl md:text-2xl mb-1 md:mb-2">📍</span>
                                <span className="text-[10px] md:text-xs font-bold text-rose-400 mb-1">클래스 장소</span>
                                <span className="text-[10px] sm:text-xs md:text-sm font-bold text-amber-900 leading-tight">대구 수성구<br />상록로 11길 13</span>
                            </div>
                        </div>

                        {/* 2. 스페셜 혜택 */}
                        <div className="bg-amber-50/30 rounded-2xl p-5 mb-8 border border-dashed border-amber-200">
                            <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                                <span className="text-amber-500">⭐</span> Special Point
                            </h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-sm text-amber-900/80">
                                    <span className="text-amber-500 shrink-0">✅</span>
                                    <span>
                                        <strong className="text-amber-900">"베리굿 미니 초콜릿 공장 견학!"</strong><br />
                                        <span className="text-xs">생카다이프 굽기와 피스타치오 페이스트를 만드는 마법 같은 과정을 직접 눈으로 구경해요!</span>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-amber-900/80">
                                    <span className="text-amber-500 shrink-0">🎁</span>
                                    <span>
                                        <strong className="text-amber-900">"베리굿초콜릿만의 프리미엄 패키지에 예쁘게 포장해서 가져가요."</strong>
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* 3. 커리큘럼 안내 (아코디언) */}
                        <div className="space-y-4">
                            <button
                                onClick={() => setIsCurriculumOpen(!isCurriculumOpen)}
                                className="w-full bg-white/50 hover:bg-white/80 transition-all duration-300 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md active:scale-[0.98] group"
                            >
                                <span className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                    <span className="text-rose-400 text-lg group-hover:animate-bounce origin-bottom">✨</span> 자세한 수업 내용 보기 (터치해서 열기/닫기)
                                </span>
                                <span className={`text-amber-500 text-xs transition-transform duration-300 ${isCurriculumOpen ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* 아코디언 내용 영역 */}
                            {isCurriculumOpen && (
                                <div className="space-y-3 animate-fade-in-down">
                                    {/* 두바이 쫀득 쿠키 */}
                                    <div className="bg-white/60 rounded-2xl p-5 shadow-sm border border-rose-50 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">🍪</span>
                                            <span className="font-bold text-amber-900">두바이 쫀득 쿠키</span>
                                        </div>
                                        <p className="text-sm text-amber-800/80 leading-relaxed">
                                            준비된 마법의 두바이 속재료와 쫀득쫀득 쭈욱~ 늘어나는 마시멜로우를 내 손으로 직접 조물조물 감싸기! 마지막엔 코코아 파우더를 톡톡 뿌려 완성해요. <span className="text-rose-500 font-medium">(내가 원하는 크기와 모양으로!)</span>
                                        </p>
                                    </div>

                                    {/* 두바이 초코 케이크 */}
                                    <div className="bg-white/60 rounded-2xl p-5 shadow-sm border border-rose-50 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">🍓</span>
                                            <span className="font-bold text-rose-800">두바이 초코 케이크</span>
                                        </div>
                                        <p className="text-sm text-amber-800/80 leading-relaxed">
                                            진짜 리얼 초콜릿을 녹여 만든 촉촉한 시트 사이에, 바삭한 두바이 속재료와 달콤한 초코 가나슈 크림 듬뿍 샌딩하기! 마지막엔 상큼한 생딸기로 예쁘게 장식해요. <span className="text-rose-500 font-medium">(1호 케이크 사이즈)</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 예약 폼 영역 컨테이너 */}
                <div ref={formRef} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-rose-100/50 p-6 md:p-10 border border-rose-50">
                    <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">예약 신청하기</h2>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. 클래스 선택 */}
                        <div>
                            <label className="block text-sm font-bold text-amber-900 mb-4">
                                1. 클래스를 선택해주세요 <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* 두바이 쫀득 쿠키 */}
                                <div
                                    onClick={() => {
                                        setSelectedClass('두바이쫀득쿠키');
                                        setPreferredDateTime('');
                                    }}
                                    className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 active:scale-95 group ${selectedClass === '두바이쫀득쿠키'
                                        ? 'border-amber-400 bg-amber-50 shadow-md transform scale-[1.02]'
                                        : 'border-rose-100 bg-white hover:border-amber-200 hover:bg-amber-50/50 hover:shadow-lg hover:-translate-y-1'
                                        }`}
                                >
                                    <div className={`text-4xl mb-2 transition-transform duration-500 origin-bottom ${selectedClass !== '두바이쫀득쿠키' ? 'group-hover:animate-bounce' : ''}`}>🍪</div>
                                    <h3 className={`text-lg font-bold ${selectedClass === '두바이쫀득쿠키' ? 'text-amber-800' : 'text-gray-700'}`}>
                                        두바이쫀득쿠키
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">바삭하고 쫀득한 피스타치오 듬뿍</p>

                                    {selectedClass === '두바이쫀득쿠키' ? (
                                        <div className="absolute top-4 right-4 text-amber-500">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="absolute -inset-1 bg-amber-100/30 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse pointer-events-none -z-10"></div>
                                    )}
                                </div>

                                {/* 두바이 초콜릿 케이크 */}
                                <div
                                    onClick={() => {
                                        setSelectedClass('두바이초콜릿케이크');
                                        setPreferredDateTime('');
                                    }}
                                    className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 active:scale-95 group ${selectedClass === '두바이초콜릿케이크'
                                        ? 'border-rose-400 bg-rose-50 shadow-md transform scale-[1.02]'
                                        : 'border-rose-100 bg-white hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-lg hover:-translate-y-1'
                                        }`}
                                >
                                    <div className={`text-4xl mb-2 transition-transform duration-500 origin-bottom ${selectedClass !== '두바이초콜릿케이크' ? 'group-hover:animate-bounce' : ''}`}>🍰</div>
                                    <h3 className={`text-lg font-bold ${selectedClass === '두바이초콜릿케이크' ? 'text-rose-800' : 'text-gray-700'}`}>
                                        두바이초콜릿케이크
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">진한 초콜릿과 바삭한 카다이프의 만남</p>

                                    {selectedClass === '두바이초콜릿케이크' ? (
                                        <div className="absolute top-4 right-4 text-rose-500">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="absolute -inset-1 bg-rose-100/30 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse pointer-events-none -z-10"></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. 상세 정보 입력 */}
                        <div className="bg-rose-50/50 p-6 rounded-2xl space-y-5 border border-rose-100">
                            <label className="block text-sm font-bold text-amber-900 mb-2">
                                2. 정보를 입력해주세요
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* 보호자 성함 */}
                                <div>
                                    <label htmlFor="guardianName" className="block text-sm font-medium text-amber-900 mb-1">
                                        보호자 성함 <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="guardianName"
                                        name="guardianName"
                                        value={formData.guardianName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all"
                                        placeholder="홍길동"
                                        required
                                    />
                                </div>

                                {/* 연락처 */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-amber-900 mb-1">
                                        보호자 연락처 <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all"
                                        placeholder="010-0000-0000"
                                        required
                                    />
                                </div>

                                {/* 아이 이름 */}
                                <div>
                                    <label htmlFor="childName" className="block text-sm font-medium text-amber-900 mb-1">
                                        아이 이름 <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="childName"
                                        name="childName"
                                        value={formData.childName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all"
                                        placeholder="김초코"
                                        required
                                    />
                                </div>

                                {/* 아이 나이 */}
                                <div>
                                    <label htmlFor="childAge" className="block text-sm font-medium text-amber-900 mb-1">
                                        아이 나이 (만 5~12세) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            id="childAge"
                                            name="childAge"
                                            min="5"
                                            max="12"
                                            value={formData.childAge}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all pr-8"
                                            placeholder="7"
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">세</span>
                                    </div>
                                </div>

                                {/* 입금자명 */}
                                <div>
                                    <label htmlFor="depositorName" className="block text-sm font-medium text-amber-900 mb-1">
                                        입금자명 <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="depositorName"
                                        name="depositorName"
                                        value={formData.depositorName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all"
                                        placeholder="홍길동"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 희망 예약 일시 */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-amber-900 mb-2">
                                    희망 예약 날짜 및 시간 <span className="text-rose-500">*</span>
                                </label>

                                {!selectedClass ? (
                                    <div className="bg-white/70 border border-dashed border-rose-200 rounded-xl p-6 text-center text-amber-800/70 text-sm">
                                        위에서 먼저 체험할 제품을 선택해 주세요 👆
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedClass === '두바이쫀득쿠키' && (
                                            <>
                                                {['2월 28일 (토) 11:00 - 12:30', '3월 1일 (일) 11:00 - 12:30', '3월 2일 (월) 11:00 - 12:30'].map((time) => {
                                                    const currentCount = slotCounts[time] || 0;
                                                    const isForcedFull = time === '2월 28일 (토) 11:00 - 12:30';
                                                    const isFull = isForcedFull || currentCount >= MAX_CAPACITY;
                                                    const remaining = isForcedFull ? 0 : MAX_CAPACITY - currentCount;
                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            disabled={isFull}
                                                            onClick={() => setPreferredDateTime(time)}
                                                            className={`px-4 py-3 rounded-xl border-2 text-sm font-bold text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 ${isFull
                                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : preferredDateTime === time
                                                                    ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm'
                                                                    : 'border-rose-100 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/30'
                                                                }`}
                                                        >
                                                            <span>{time}</span>
                                                            {isFull ? (
                                                                <span className="text-xs font-normal opacity-80">마감되었습니다 😭</span>
                                                            ) : (
                                                                <span className="text-xs font-normal text-amber-600 opacity-90">잔여: {remaining}자리</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </>
                                        )}
                                        {selectedClass === '두바이초콜릿케이크' && (
                                            <>
                                                {['2월 28일 (토) 17:00 - 18:30', '3월 1일 (일) 15:00 - 16:30', '3월 2일 (월) 15:00 - 16:30'].map((time) => {
                                                    const currentCount = slotCounts[time] || 0;
                                                    const isForcedLowCapacity = time === '2월 28일 (토) 17:00 - 18:30';
                                                    const isFull = currentCount >= (isForcedLowCapacity ? 2 : MAX_CAPACITY);
                                                    const remaining = isForcedLowCapacity ? 2 - currentCount : MAX_CAPACITY - currentCount;
                                                    const showUrgency = isForcedLowCapacity && !isFull;

                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            disabled={isFull}
                                                            onClick={() => setPreferredDateTime(time)}
                                                            className={`px-4 py-3 rounded-xl border-2 text-sm font-bold text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 ${isFull
                                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : preferredDateTime === time
                                                                    ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-sm'
                                                                    : showUrgency
                                                                        ? 'border-rose-300 bg-rose-50/50 text-gray-600 hover:border-rose-400 hover:bg-rose-100/50 animate-pulse'
                                                                        : 'border-rose-100 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50/30'
                                                                }`}
                                                        >
                                                            <span>{time}</span>
                                                            {isFull ? (
                                                                <span className="text-xs font-normal opacity-80">마감되었습니다 😭</span>
                                                            ) : showUrgency ? (
                                                                <span className="text-xs font-bold text-rose-600 animate-bounce mt-1">🔥 마감임박! 잔여: {remaining}자리</span>
                                                            ) : (
                                                                <span className="text-xs font-normal text-rose-600 opacity-90">잔여: {remaining}자리</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 알러지 및 남기실 말씀 */}
                            <div className="pt-2">
                                <label htmlFor="allergyOrMessage" className="block text-sm font-medium text-amber-900 mb-1">
                                    알러지 유무 / 남기실 말씀 (선택)
                                </label>
                                <textarea
                                    id="allergyOrMessage"
                                    name="allergyOrMessage"
                                    value={formData.allergyOrMessage}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all resize-none"
                                    placeholder="견과류 알러지가 있다면 반드시 적어주세요!"
                                />
                            </div>
                        </div>

                        {/* 결제 및 입금 안내 */}
                        <div className="bg-amber-100/50 p-6 rounded-2xl border border-amber-200 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                            <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                                <span className="text-xl">💳</span> 결제 및 입금 안내
                            </h3>
                            <div className="text-amber-800 space-y-3">
                                <p className="font-medium bg-white/60 inline-block px-3 py-1 rounded-lg">
                                    클래스 비용: <span className="text-rose-600 font-bold">1인 50,000원</span>
                                </p>
                                <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-amber-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">입금 계좌</p>
                                            <p className="font-bold text-gray-800 text-lg">
                                                신한은행 110-583-680821
                                            </p>
                                            <p className="text-sm text-gray-600">예금주: 베리굿초콜릿컴퍼니(VCC))</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopyAccount}
                                            className="shrink-0 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2 px-4 rounded-lg border border-amber-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            복사하기
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-amber-700/80 mt-2">
                                    * 예약 신청 후 2시간 내 미입금 시 예약이 자동 취소될 수 있습니다.
                                </p>
                            </div>
                        </div>

                        {/* 3. 동의 및 제출 */}
                        <div className="space-y-6 pt-2">
                            <div className="flex items-start bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                <input
                                    type="checkbox"
                                    id="agreement"
                                    checked={isAgreed}
                                    onChange={(e) => setIsAgreed(e.target.checked)}
                                    className="mt-1 h-5 w-5 text-amber-500 border-amber-300 rounded focus:ring-amber-400 accent-amber-500"
                                />
                                <label htmlFor="agreement" className="ml-3 text-sm text-amber-900 leading-relaxed cursor-pointer">
                                    개인정보 수집 및 이용에 동의합니다. <span className="text-rose-500 font-bold">*</span><br />
                                    <span className="text-xs text-amber-700/70 block mt-1">수집된 정보는 클래스 예약 및 안내 목적으로만 사용되며, 행사 종료 후 파기됩니다.</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 
                                ${isSubmitting
                                        ? 'bg-amber-400 cursor-wait'
                                        : 'bg-gradient-to-r from-amber-500 to-rose-400 hover:from-amber-600 hover:to-rose-500 hover:shadow-xl hover:-translate-y-1'}`}
                            >
                                {isSubmitting ? '예약 처리 중...' : '예약 신청하기 ✨'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 하단 문의하기 영역 */}
                <div className="mt-12 text-center">
                    <p className="text-amber-800 mb-3 text-sm font-medium">온라인 예약이 어려우신가요?</p>
                    <a
                        href="tel:070-7840-0717"
                        className="inline-flex items-center justify-center gap-2 bg-white/60 hover:bg-white text-amber-900 px-6 py-3 rounded-full shadow-sm hover:shadow-md border border-rose-100 transition-all font-bold group"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">📞</span>
                        전화 / 문자로 문의하기
                    </a>
                </div>

                {/* 브랜드 푸터 */}
                <p className="text-center text-xs text-rose-300 mt-12 pb-8">
                    © VeryGood Chocolate. All rights reserved.
                </p>

                {/* 플로팅 '바로 예약하기' 버튼 */}
                <div className="fixed bottom-0 left-0 w-full p-4 z-50 md:hidden pointer-events-none flex justify-center">
                    <div className="w-full max-w-2xl pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full bg-[#E56E25] hover:bg-[#d4621c] text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl shadow-[#E56E25]/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
                        >
                            👇 1분 만에 예약 신청하기
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KidsClassPage;
