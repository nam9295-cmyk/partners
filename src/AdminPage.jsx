import React, { useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const AdminPage = () => {
    // 인증 및 데이터 상태
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);

    // 데이터 불러오기
    const fetchReservations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "kids_class_reservations"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Timestamp를 보기 좋은 날짜 문자열로 변환
                createdAt: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
            }));
            setReservations(data);
        } catch (error) {
            console.error("Error fetching documents: ", error);
            alert("데이터를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 관리자 로그인 처리
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin1234') {
            setIsAdmin(true);
            fetchReservations();
        } else {
            alert('비밀번호가 올바르지 않습니다.');
            setPassword('');
        }
    };

    // 안내 문자 복사
    const handleCopyMessage = async (item) => {
        const message = `[베리굿초콜릿] ${item.childName}님, 달콤한 키즈 클래스 예약이 확정되었습니다! 🍫\n\n🗓 예약 일시: ${item.preferredDateTime}\n📍 매장 위치: 대구 수성구 상록로 11길 13\n\n[✔️ 방문 전 확인해 주세요!]\n👕 앞치마는 저희가 제공하지만, 초콜릿이 묻을 수 있으니 아끼는 새 옷이나 흰 옷은 피해주세요.\n🎀 위생을 위해 머리가 긴 아이들은 머리를 단정하게 묶고 방문해 주세요.\n⏰ 원활한 수업 진행을 위해 클래스 시작 5분 전까지 꼭 도착 부탁드립니다.\n\n아이들이 잊지 못할 행복한 추억을 만들 수 있도록 예쁘게 준비해 둘게요. 곧 뵙겠습니다! 🧑🍳`;

        try {
            await navigator.clipboard.writeText(message);
            alert("안내 문구가 클립보드에 복사되었습니다!");
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert("복사에 실패했습니다.");
        }
    };

    // 입금 확인 및 예약 확정 처리
    const handleConfirmPayment = async (id, item) => {
        if (!window.confirm("입금을 확인하고 예약을 확정하시겠습니까?")) return;

        try {
            const docRef = doc(db, "kids_class_reservations", id);
            await updateDoc(docRef, { status: "confirmed" });
            fetchReservations();

            // 안내 문구 클립보드 복사
            await handleCopyMessage(item);
            alert("예약이 확정되었습니다!");
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("예약 확정 처리에 실패했습니다.");
        }
    };

    // 엑셀 다운로드 처리
    const handleExport = () => {
        // 엑셀로 변환할 데이터 가공 (필요한 컬럼만 선택)
        const excelData = reservations.map(item => ({
            '신청일시': item.createdAt,
            '보호자성함': item.guardianName,
            '연락처': item.phone,
            '아이이름': item.childName,
            '나이': item.childAge,
            '신청클래스': item.selectedClass,
            '예약시간': item.preferredDateTime,
            '알러지/메시지': item.allergyOrMessage,
            '현재상태': item.status === 'confirmed' ? '예약 확정' : '입금 대기'
        }));

        // 워크시트 생성
        const ws = XLSX.utils.json_to_sheet(excelData);
        // 컬럼 너비 설정 (옵션)
        const wscols = [
            { wch: 20 }, // 신청일시
            { wch: 15 }, // 보호자성함
            { wch: 15 }, // 연락처
            { wch: 15 }, // 아이이름
            { wch: 10 }, // 나이
            { wch: 20 }, // 신청클래스
            { wch: 25 }, // 예약시간
            { wch: 30 }, // 알러지/메시지
            { wch: 15 }  // 현재상태
        ];
        ws['!cols'] = wscols;

        // 워크북 생성 및 시트 추가
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "키즈클래스명단");

        // 파일 저장 (파일명: 베리굿_키즈클래스_명단_YYYYMMDD.xlsx)
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        XLSX.writeFile(wb, `베리굿_키즈클래스_명단_${date}.xlsx`);
    };

    // === [화면 1] 관리자 로그인 ===
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">관리자 페이지</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="관리자 비밀번호"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-amber-800 text-white py-2 rounded-lg hover:bg-amber-900 transition-colors"
                        >
                            로그인
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // === [화면 2] 관리자 대시보드 ===
    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        🍫 베리굿초콜릿 키즈 클래스 예약 현황
                    </h1>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-semibold"
                    >
                        <span>📥</span> 엑셀 다운로드
                    </button>
                </div>

                {/* 데이터 테이블 */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">데이터를 불러오는 중입니다...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">신청일시</th>
                                        <th className="px-6 py-4 whitespace-nowrap">보호자</th>
                                        <th className="px-6 py-4 whitespace-nowrap">아이</th>
                                        <th className="px-6 py-4 whitespace-nowrap">클래스</th>
                                        <th className="px-6 py-4 whitespace-nowrap">예약시간</th>
                                        <th className="px-6 py-4 min-w-[200px]">남기실 말씀</th>
                                        <th className="px-6 py-4 whitespace-nowrap">상태 및 관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reservations.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-10 text-gray-500">
                                                아직 예약 내역이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        reservations.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.createdAt}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div>{item.guardianName}</div>
                                                    <div className="text-sm text-gray-500 font-normal mt-1">{item.phone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{item.childName}</div>
                                                    <div className="text-sm text-gray-500 mt-1">{item.childAge}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">
                                                        {item.selectedClass}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                                                    {item.preferredDateTime}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-sm max-w-xs break-words">
                                                    {item.allergyOrMessage || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {item.status === 'pending' ? (
                                                            <>
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                                    입금 대기
                                                                </span>
                                                                <button
                                                                    onClick={() => handleConfirmPayment(item.id, item)}
                                                                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 hover:text-green-600 transition-colors text-sm font-bold shadow-sm"
                                                                >
                                                                    ✅ 입금 확인
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                    예약 확정
                                                                </span>
                                                                <button
                                                                    onClick={() => handleCopyMessage(item)}
                                                                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 hover:text-amber-600 transition-colors text-sm font-bold shadow-sm flex items-center gap-1"
                                                                >
                                                                    <span>📋</span> 문자 복사
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-500 text-right">
                            총 <b>{reservations.length}</b>건 예약
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
