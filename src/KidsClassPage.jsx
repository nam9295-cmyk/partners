import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

const KidsClassPage = () => {
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

    // 실시간 예약 현황 가져오기
    useEffect(() => {
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

        // 컴포넌트 언마운트 시 구독 해제
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
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
        if (isNaN(age) || age < 6 || age > 13) {
            alert('키즈 베이킹 클래스는 6세부터 13세까지 참여 가능합니다.');
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
            {/* 메인 컨텐츠 컨테이너 */}
            <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

                {/* 상단 비주얼 영역 */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <img
                        src="/logo.png"
                        alt="베리굿초콜릿 로고"
                        className="h-16 md:h-20 object-contain mb-6 drop-shadow-sm"
                    />

                    <div className="w-full rounded-3xl overflow-hidden shadow-xl shadow-rose-200/50 mb-8 border-4 border-white">
                        <img
                            src="/poster.jpg"
                            alt="키즈 베이킹 클래스 포스터"
                            className="w-full h-auto object-cover aspect-[4/5] object-center"
                            onError={(e) => {
                                // 포스터 이미지가 없을 경우 대체 이미지나 영역 표시
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1557308536-ee471ef2c390?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                            }}
                        />
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-sm border border-rose-100 w-full relative">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-400 text-white px-6 py-2 rounded-full font-bold shadow-md text-sm whitespace-nowrap">
                            👩‍🍳 달콤한 키즈 베이킹 클래스 👨‍🍳
                        </div>
                        <ul className="mt-4 space-y-3 text-left text-amber-900 border-b border-rose-100/50 pb-6 mb-2">
                            <li className="flex items-start gap-3">
                                <span className="text-xl shrink-0">👧👦</span>
                                <div>
                                    <strong className="block text-rose-500">참여 대상</strong>
                                    6세 - 13세 (초등학생)
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-xl shrink-0">⏱️</span>
                                <div>
                                    <strong className="block text-rose-500">소요 시간</strong>
                                    약 90분 (1시간 30분)
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-xl shrink-0">📍</span>
                                <div>
                                    <strong className="block text-rose-500">클래스 장소</strong>
                                    대구 수성구 상록로 11길 13, 1층 베리굿초콜릿
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 예약 폼 영역 컨테이너 */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-rose-100/50 p-6 md:p-10 border border-rose-50">
                    <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">예약 신청하기</h2>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. 클래스 선택 */}
                        <div>
                            <label className="block text-sm font-bold text-amber-900 mb-4">
                                1. 클래스를 선택해주세요 <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 두바이 쫀득 쿠키 */}
                                <div
                                    onClick={() => {
                                        setSelectedClass('두바이쫀득쿠키');
                                        setPreferredDateTime('');
                                    }}
                                    className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 ${selectedClass === '두바이쫀득쿠키'
                                        ? 'border-amber-400 bg-amber-50 shadow-md transform scale-[1.02]'
                                        : 'border-rose-100 bg-white hover:border-amber-200 hover:bg-amber-50/30'
                                        }`}
                                >
                                    <div className="text-4xl mb-2">🍪</div>
                                    <h3 className={`text-lg font-bold ${selectedClass === '두바이쫀득쿠키' ? 'text-amber-800' : 'text-gray-700'}`}>
                                        두바이쫀득쿠키
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">바삭하고 쫀득한 피스타치오 듬뿍</p>

                                    {selectedClass === '두바이쫀득쿠키' && (
                                        <div className="absolute top-4 right-4 text-amber-500">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* 두바이 초콜릿 케이크 */}
                                <div
                                    onClick={() => {
                                        setSelectedClass('두바이초콜릿케이크');
                                        setPreferredDateTime('');
                                    }}
                                    className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 ${selectedClass === '두바이초콜릿케이크'
                                        ? 'border-rose-400 bg-rose-50 shadow-md transform scale-[1.02]'
                                        : 'border-rose-100 bg-white hover:border-rose-200 hover:bg-rose-50/30'
                                        }`}
                                >
                                    <div className="text-4xl mb-2">🍰</div>
                                    <h3 className={`text-lg font-bold ${selectedClass === '두바이초콜릿케이크' ? 'text-rose-800' : 'text-gray-700'}`}>
                                        두바이초콜릿케이크
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">진한 초콜릿과 바삭한 카다이프의 만남</p>

                                    {selectedClass === '두바이초콜릿케이크' && (
                                        <div className="absolute top-4 right-4 text-rose-500">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
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
                                        아이 나이 (6~13세) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            id="childAge"
                                            name="childAge"
                                            min="6"
                                            max="13"
                                            value={formData.childAge}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all pr-8"
                                            placeholder="8"
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedClass === '두바이쫀득쿠키' && (
                                            <>
                                                {['2월 28일 (토) 11:00 - 12:30', '3월 1일 (일) 11:00 - 12:30', '3월 2일 (월) 11:00 - 12:30'].map((time) => {
                                                    const currentCount = slotCounts[time] || 0;
                                                    const isFull = currentCount >= MAX_CAPACITY;
                                                    const remaining = MAX_CAPACITY - currentCount;
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
                                                {['2월 28일 (토) 15:00 - 16:30', '3월 1일 (일) 15:00 - 16:30', '3월 2일 (월) 15:00 - 16:30'].map((time) => {
                                                    const currentCount = slotCounts[time] || 0;
                                                    const isFull = currentCount >= MAX_CAPACITY;
                                                    const remaining = MAX_CAPACITY - currentCount;
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
                                                                    : 'border-rose-100 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50/30'
                                                                }`}
                                                        >
                                                            <span>{time}</span>
                                                            {isFull ? (
                                                                <span className="text-xs font-normal opacity-80">마감되었습니다 😭</span>
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
                                            <p className="text-sm text-gray-600">예금주: 천정민(베리굿초콜릿컴퍼니(VCC))</p>
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
                        href="tel:010-0000-0000"
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

            </div>
        </div>
    );
};

export default KidsClassPage;
