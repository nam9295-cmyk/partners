import React, { useState } from 'react';
import Lottie from 'lottie-react';
import firecrackerAnimation from './assets/firecracker.json';
import missionCheckAnimation from './assets/mission_check.json';
import productImageA from './assets/product_a.webp';
import productImageB from './assets/product_b.webp';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SupportersPage = () => {
    // 폼 데이터 상태 관리
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        blogId: '',
        address: ''
    });

    // 제품 선택 상태 관리
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 동의 체크박스 상태 관리
    const [isAgreed, setIsAgreed] = useState(false);

    // 제출 상태 관리
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 입력 필드 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 제품 선택 유효성 검사
        if (!selectedProduct) {
            alert('체험하실 제품을 선택해주세요!');
            return;
        }

        // 동의 체크박스 유효성 검사
        if (!isAgreed) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        // 제출 시작
        setIsSubmitting(true);

        try {
            // Firestore에 데이터 저장
            await addDoc(collection(db, "supporters"), {
                name: formData.name,
                phone: formData.phone,
                blogId: formData.blogId,
                address: formData.address,
                selectedProduct: selectedProduct,
                agreed: isAgreed,
                createdAt: serverTimestamp()
            });

            // 성공 알림 및 초기화
            alert('신청이 완료되었습니다! 🎉');
            setFormData({
                name: '',
                phone: '',
                blogId: '',
                address: ''
            });
            setSelectedProduct(null);
            setIsAgreed(false);

        } catch (error) {
            console.error("Error adding document: ", error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl shadow-rose-200/50 max-w-2xl w-full p-8 md:p-10">

                {/* 로고 영역 */}
                <div className="flex justify-center mb-4">
                    <img
                        src="/logo.png"
                        alt="베리굿초콜릿 로고"
                        className="h-16 md:h-20 object-contain"
                    />
                </div>

                {/* 헤더 영역 */}
                <div className="mb-10 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-amber-900 inline-block relative">
                        체험단 선정을 축하합니다!
                        <Lottie
                            animationData={firecrackerAnimation}
                            loop={true}
                            className="w-16 h-16 md:w-20 md:h-20 absolute -right-14 -top-5 md:-right-18 md:-top-6"
                        />
                    </h2>
                    <p className="text-rose-400 mt-2 text-sm">VeryGood Chocolate Supporters</p>
                </div>

                {/* 가이드라인 영역 - 편지지/메모장 스타일 (강조됨) */}
                <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-10 mb-10 border-2 border-dashed border-rose-300 shadow-sm">
                    {/* 장식 요소 (확대됨) */}
                    <div className="absolute -top-5 left-6 bg-rose-300 text-white text-lg md:text-xl px-6 py-1 rounded-full font-bold shadow-md flex items-center gap-2">
                        <Lottie
                            animationData={missionCheckAnimation}
                            loop={true}
                            className="w-9 h-9"
                        />
                        체험단 미션 안내
                    </div>
                    <div className="mt-8 space-y-6">
                        {/* Greeting */}
                        <p className="text-amber-900 text-sm md:text-base leading-relaxed mb-6 border-b border-rose-100 pb-4">
                            안녕하세요, <b>베리굿초콜릿</b> 체험단에 선정되신 것을 축하드립니다! 💕<br />
                            아래 가이드라인에 맞춰 정성스러운 후기 부탁드립니다.
                        </p>

                        {/* Part 1: 기본 미션 */}
                        <div>
                            <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                                <span className="bg-amber-100 text-amber-800 rounded-lg px-2 py-1 text-xs md:text-sm shadow-sm">Part 1</span>
                                기본 미션 (Basic)
                            </h4>
                            <ul className="space-y-3 text-sm md:text-base text-gray-700 bg-white/50 p-4 rounded-xl border border-rose-100">
                                <li className="flex items-start gap-3">
                                    <span className="text-xl shrink-0">📅</span>
                                    <span>
                                        <span className="font-bold text-amber-900">업로드:</span> 제품 수령 후 <span className="text-rose-500 font-extrabold underline decoration-wavy decoration-rose-300 underline-offset-4">3일 이내</span> 포스팅 완료
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-xl shrink-0">📸</span>
                                    <span>
                                        <span className="font-bold text-amber-900">미디어:</span> 고화질 사진 <span className="font-bold text-rose-500 bg-rose-50 px-1 rounded">5장 이상</span> + 동영상(움짤) <span className="font-bold text-rose-500 bg-rose-50 px-1 rounded">1개 이상</span> 필수
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-xl shrink-0">⏳</span>
                                    <span>
                                        <span className="font-bold text-amber-900">유지기간:</span> 포스팅 작성 후 1년 이상 유지 (비공개 금지)
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Part 2: 스토리텔링 포인트 */}
                        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-5 border border-rose-200 shadow-sm relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-100 rounded-full opacity-50 blur-2xl"></div>
                            <h4 className="font-bold text-rose-900 mb-3 flex items-center gap-2 text-base md:text-lg relative z-10">
                                <span className="bg-white text-rose-500 rounded-lg px-2 py-1 text-xs md:text-sm shadow-sm border border-rose-100">Part 2</span>
                                스토리텔링 포인트 (Key Points) ✨
                            </h4>
                            <ul className="space-y-3 text-sm md:text-base text-rose-900 relative z-10">
                                <li className="flex items-start gap-3">
                                    <span className="text-lg shrink-0 mt-0.5">🇫🇷</span>
                                    <span>
                                        <span className="font-bold text-rose-700">르 꼬르동 블루의 품격:</span> 프랑스 본교 출신 쇼콜라티에가 직접 만든 <span className="underline decoration-rose-300 decoration-2 underline-offset-2">'클래스가 다른 수제 초콜릿'</span>
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-lg shrink-0 mt-0.5">🎁</span>
                                    <span>
                                        <span className="font-bold text-rose-700">센스 있는 선물:</span> 회사 동료, 지인에게 돌렸을 때 <span className="bg-white/80 px-1 rounded font-medium">"센스 있다"</span> 칭찬받는 고급 패키지
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-lg shrink-0 mt-0.5">🍫</span>
                                    <span>
                                        <span className="font-bold text-rose-700">깊이가 다른 맛:</span> 100% 카카오 버터 & 벨기에산 리얼 초콜릿의 부드러운 풍미
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Part 3: 필수 키워드 (Hashtags) */}
                        <div>
                            <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                                <span className="bg-amber-100 text-amber-800 rounded-lg px-2 py-1 text-xs md:text-sm shadow-sm">Part 3</span>
                                필수 키워드 (Copy Tags)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {['#수제초콜릿', '#발렌타인데이초콜릿', '#설선물세트', '#베리굿초콜릿', '#대구초콜릿'].map((tag, index) => (
                                    <span key={index} className="bg-white border-2 border-rose-100 text-rose-500 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm cursor-pointer hover:bg-rose-50 hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 제품 선택 영역 */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-amber-900 mb-3">
                        체험하실 제품을 선택해주세요 <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        {/* A세트 */}
                        <div
                            onClick={() => setSelectedProduct('A')}
                            className={`relative cursor-pointer rounded-2xl transition-all duration-300 overflow-hidden group ${selectedProduct === 'A'
                                ? 'ring-4 ring-rose-300 shadow-lg shadow-rose-200 scale-[1.02] z-10'
                                : selectedProduct !== null
                                    ? 'opacity-40 blur-[2px] scale-95 border-2 border-transparent hover:opacity-100 hover:blur-0 hover:scale-100'
                                    : 'border-2 border-gray-100 hover:border-rose-200 hover:shadow-md'
                                }`}
                        >
                            <img
                                src={productImageA}
                                alt="A세트"
                                className="w-full h-auto object-cover aspect-square"
                            />
                            <div className={`absolute bottom-0 w-full p-3 text-center transition-colors duration-300 ${selectedProduct === 'A' ? 'bg-rose-500/90 text-white' : 'bg-gray-100/80 text-gray-500 group-hover:bg-rose-100/80 group-hover:text-rose-600'
                                }`}>
                                <span className="font-bold text-lg">A세트</span>
                            </div>
                        </div>

                        {/* B세트 */}
                        <div
                            onClick={() => setSelectedProduct('B')}
                            className={`relative cursor-pointer rounded-2xl transition-all duration-300 overflow-hidden group ${selectedProduct === 'B'
                                ? 'ring-4 ring-rose-300 shadow-lg shadow-rose-200 scale-[1.02] z-10'
                                : selectedProduct !== null
                                    ? 'opacity-40 blur-[2px] scale-95 border-2 border-transparent hover:opacity-100 hover:blur-0 hover:scale-100'
                                    : 'border-2 border-gray-100 hover:border-rose-200 hover:shadow-md'
                                }`}
                        >
                            <img
                                src={productImageB}
                                alt="B세트"
                                className="w-full h-auto object-cover aspect-square"
                            />
                            <div className={`absolute bottom-0 w-full p-3 text-center transition-colors duration-300 ${selectedProduct === 'B' ? 'bg-rose-500/90 text-white' : 'bg-gray-100/80 text-gray-500 group-hover:bg-rose-100/80 group-hover:text-rose-600'
                                }`}>
                                <span className="font-bold text-lg">B세트</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 입력 폼 영역 */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* 성함 입력란 */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-amber-900 mb-2">
                            성함 <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-5 py-3 border-2 border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all duration-200 bg-white/70 placeholder-rose-300"
                            placeholder="홍길동"
                            required
                        />
                    </div>

                    {/* 전화번호 입력란 */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-amber-900 mb-2">
                            전화번호 <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-5 py-3 border-2 border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all duration-200 bg-white/70 placeholder-rose-300"
                            placeholder="010-1234-5678"
                            required
                        />
                    </div>

                    {/* 블로그 ID 또는 URL 입력란 */}
                    <div>
                        <label htmlFor="blogId" className="block text-sm font-medium text-amber-900 mb-2">
                            블로그 ID 또는 URL <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="blogId"
                            name="blogId"
                            value={formData.blogId}
                            onChange={handleInputChange}
                            className="w-full px-5 py-3 border-2 border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all duration-200 bg-white/70 placeholder-rose-300"
                            placeholder="blog.naver.com/yourid 또는 블로그 ID"
                            required
                        />
                    </div>

                    {/* 배송지 주소 입력란 */}
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-amber-900 mb-2">
                            배송지 주소 <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-5 py-3 border-2 border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all duration-200 bg-white/70 placeholder-rose-300 resize-none"
                            placeholder="우편번호, 도로명 주소, 상세주소를 모두 입력해주세요"
                            required
                        />
                    </div>

                    {/* 동의 영역 */}
                    <div className="flex items-start pt-2">
                        <input
                            type="checkbox"
                            id="agreement"
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            className="mt-1 h-5 w-5 text-rose-400 border-rose-200 rounded focus:ring-rose-300 accent-rose-400"
                        />
                        <label htmlFor="agreement" className="ml-3 text-sm text-amber-800">
                            개인정보 수집 및 이용에 동의합니다. <span className="text-rose-400">*</span>
                        </label>
                    </div>

                    {/* 제출 버튼 */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white py-4 px-6 rounded-xl font-semibold shadow-lg shadow-amber-900/30 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:shadow-xl hover:shadow-amber-900/40 hover:-translate-y-1'}`}
                        >
                            {isSubmitting ? '🍫 제출 중...' : '🍫 제출하기'}
                        </button>
                    </div>

                    {/* 브랜드 푸터 */}
                    <p className="text-center text-xs text-rose-300 mt-6">
                        © VeryGood Chocolate. All rights reserved.
                    </p>

                </form>
            </div >
        </div >
    );
};

export default SupportersPage;
