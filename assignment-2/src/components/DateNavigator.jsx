/* =============================================
   DateNavigator.jsx — 일간 날짜 네비게이터
   선택된 날짜 표시 + 이전/다음 날짜 이동
   ============================================= */
import { formatDateDisplay, isToday } from '../utils/date';

/**
 * props:
 *   selectedDate  — 현재 선택된 날짜 ('YYYY-MM-DD')
 *   onPrevDate    — 이전 날짜 버튼 클릭 시 호출
 *   onNextDate    — 다음 날짜 버튼 클릭 시 호출
 */
function DateNavigator({ selectedDate, onPrevDate, onNextDate }) {
  const todayBadgeVisible = isToday(selectedDate);

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-2 py-1">

      {/* 이전 날짜 버튼 */}
      <button
        type="button"
        onClick={onPrevDate}
        aria-label="이전 날짜"
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        ←
      </button>

      {/* 날짜 표시 영역 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {formatDateDisplay(selectedDate)}
        </span>

        {/* 오늘 배지 — 선택된 날짜가 오늘일 때만 표시 */}
        {todayBadgeVisible && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            오늘
          </span>
        )}
      </div>

      {/* 다음 날짜 버튼 */}
      <button
        type="button"
        onClick={onNextDate}
        aria-label="다음 날짜"
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        →
      </button>

    </div>
  );
}

export default DateNavigator;
