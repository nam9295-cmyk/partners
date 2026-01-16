import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const AdminPage = () => {
    // 인증 및 데이터 상태
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [supporters, setSupporters] = useState([]);
    const [loading, setLoading] = useState(false);

    // 데이터 불러오기
    const fetchSupporters = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "supporters"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Timestamp를 보기 좋은 날짜 문자열로 변환
                createdAt: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
            }));
            setSupporters(data);
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
            fetchSupporters();
        } else {
            alert('비밀번호가 올바르지 않습니다.');
            setPassword('');
        }
    };

    // 엑셀 다운로드 처리
    const handleExport = () => {
        // 엑셀로 변환할 데이터 가공 (필요한 컬럼만 선택)
        const excelData = supporters.map(item => ({
            '신청일시': item.createdAt,
            '성함': item.name,
            '연락처': item.phone,
            '선택제품': item.selectedProduct === 'A' ? 'A세트' : 'B세트',
            '블로그주소': item.blogId,
            '배송지': item.address,
            '개인정보동의': item.agreed ? '동의함' : '미동의'
        }));

        // 워크시트 생성
        const ws = XLSX.utils.json_to_sheet(excelData);
        // 컬럼 너비 설정 (옵션)
        const wscols = [
            { wch: 20 }, // 신청일시
            { wch: 10 }, // 성함
            { wch: 15 }, // 연락처
            { wch: 10 }, // 선택제품
            { wch: 30 }, // 블로그주소
            { wch: 40 }, // 배송지
            { wch: 10 }  // 개인정보동의
        ];
        ws['!cols'] = wscols;

        // 워크북 생성 및 시트 추가
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "체험단명단");

        // 파일 저장 (파일명: 베리굿_체험단_명단_YYYYMMDD.xlsx)
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        XLSX.writeFile(wb, `베리굿_체험단_명단_${date}.xlsx`);
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
                        📋 베리굿초콜릿 체험단 신청 현황
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
                                        <th className="px-6 py-4 whitespace-nowrap">성함</th>
                                        <th className="px-6 py-4 whitespace-nowrap">연락처</th>
                                        <th className="px-6 py-4 whitespace-nowrap">제품</th>
                                        <th className="px-6 py-4 whitespace-nowrap">블로그</th>
                                        <th className="px-6 py-4 min-w-[300px]">주소</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {supporters.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-gray-500">
                                                아직 신청 내역이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        supporters.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.createdAt}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.phone}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.selectedProduct === 'A' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {item.selectedProduct}세트
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={item.blogId}>
                                                    {item.blogId}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {item.address}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-500 text-right">
                            총 <b>{supporters.length}</b>명 신청
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
