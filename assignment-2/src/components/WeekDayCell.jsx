/* =============================================
   WeekDayCell.jsx — 주간 뷰 개별 날짜 셀
   ============================================= */

// 상태(선택됨 / 오늘 / 일반)에 따른 스타일 매핑
// — 상태 판단을 컴포넌트 상단에서 한 번만 하고 여기서 일괄 참조
const STYLES = {
  selected: {
    container: 'bg-blue-500',
    dayName:   'text-blue-100',
    dayNum:    'text-white',
    count:     'text-blue-100',
    check:     'text-green-200',
  },
  today: {
    container: 'hover:bg-gray-100',
    dayName:   'text-blue-400',
    dayNum:    'text-blue-500',
    count:     'text-blue-500',
    check:     'text-green-500',
  },
  normal: {
    container: 'hover:bg-gray-100',
    dayName:   'text-gray-400',
    dayNum:    'text-gray-700',
    count:     'text-blue-500',
    check:     'text-green-500',
  },
};

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
  const dayNumber = Number(date.split('-')[2]);

  // 상태를 한 번만 판단해 스타일 객체 선택
  const s = STYLES[isSelected ? 'selected' : isToday ? 'today' : 'normal'];

  return (
    <li
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 rounded-lg cursor-pointer transition-colors select-none ${s.container}`}
    >
      {/* 요일 이름 */}
      <span className={`text-xs mb-0.5 ${s.dayName}`}>
        {dayName}
      </span>

      {/* 날짜 숫자 */}
      <span className={`text-sm font-semibold ${s.dayNum}`}>
        {dayNumber}
      </span>

      {/* todo 상태 표시 영역 — 높이 고정으로 정렬 유지 */}
      <div className="mt-0.5 h-4 flex items-center justify-center">
        {allDone ? (
          // 전부 완료 → 체크 표시
          <span className={`text-xs font-bold ${s.check}`}>✓</span>
        ) : activeCount > 0 ? (
          // 미완료 항목 있음 → 개수 표시
          <span className={`text-xs font-medium ${s.count}`}>{activeCount}</span>
        ) : null /* 할 일 없음 → 빈칸 */}
      </div>
    </li>
  );
}

export default WeekDayCell;
