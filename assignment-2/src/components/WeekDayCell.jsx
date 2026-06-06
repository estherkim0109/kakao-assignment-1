/* =============================================
   WeekDayCell.jsx — 주간 뷰 개별 날짜 셀
   ============================================= */

/**
 * props:
 *   dayName     — 요일 이름 ('월'~'일')
 *   date        — 날짜 키 ('YYYY-MM-DD')
 *   activeCount — 해당 날짜의 미완료 todo 개수
 *   allDone     — 할 일이 1개 이상이고 전부 완료된 경우
 *   isToday     — 오늘 날짜 여부
 *   isSelected  — 현재 일간 뷰에서 선택된 날짜 여부
 *   onClick     — 셀 클릭 시 호출
 */
function WeekDayCell({ dayName, date, activeCount, allDone, isToday, isSelected, onClick }) {
  // 날짜 숫자만 추출 (1~31)
  const dayNumber = Number(date.split('-')[2]);

  return (
    <li
      onClick={onClick}
      className={[
        'flex-1 flex flex-col items-center py-2 rounded-lg cursor-pointer transition-colors select-none',
        isSelected ? 'bg-blue-500' : 'hover:bg-gray-100',
      ].join(' ')}
    >
      {/* 요일 이름 */}
      <span className={`text-xs mb-0.5 ${
        isSelected ? 'text-blue-100'
        : isToday   ? 'text-blue-400'
        :              'text-gray-400'
      }`}>
        {dayName}
      </span>

      {/* 날짜 숫자 — 오늘이면 파란색, 선택됐으면 흰색 */}
      <span className={`text-sm font-semibold ${
        isSelected ? 'text-white'
        : isToday   ? 'text-blue-500'
        :              'text-gray-700'
      }`}>
        {dayNumber}
      </span>

      {/* todo 상태 표시 영역 — 높이 고정으로 정렬 유지 */}
      <div className="mt-0.5 h-4 flex items-center justify-center">
        {allDone ? (
          // 전부 완료 → 체크 표시
          <span className={`text-xs font-bold ${isSelected ? 'text-green-200' : 'text-green-500'}`}>
            ✓
          </span>
        ) : activeCount > 0 ? (
          // 미완료 항목 있음 → 개수 표시
          <span className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}>
            {activeCount}
          </span>
        ) : null /* 할 일 없음 → 빈칸 */}
      </div>
    </li>
  );
}

export default WeekDayCell;
