/* =============================================
   WeekView.jsx — 주간 뷰 (월~일 7칸)
   ============================================= */
import { getWeekDays, getTodayKey } from '../utils/date';
import WeekDayCell from './WeekDayCell';

// 주간 뷰 요일 이름 — 월요일 시작
const WEEK_DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

/**
 * 주 범위 레이블 생성
 * 같은 달: "6월 2일 ~ 8일"
 * 다른 달: "5월 26일 ~ 6월 1일"
 */
function getWeekRangeLabel(weekDays) {
  const [, fm, fd] = weekDays[0].split('-').map(Number); // 월요일
  const [, lm, ld] = weekDays[6].split('-').map(Number); // 일요일
  return fm === lm
    ? `${fm}월 ${fd}일 ~ ${ld}일`
    : `${fm}월 ${fd}일 ~ ${lm}월 ${ld}일`;
}

/**
 * props:
 *   weekBaseDate       — 주간 뷰 기준 날짜 ('YYYY-MM-DD')
 *   selectedDate       — 일간 뷰에서 선택된 날짜 ('YYYY-MM-DD')
 *   todoSummaryByDate  — 날짜별 todo 요약 { [dateKey]: { total, active } }
 *                        todoItems 전체 대신 집계된 데이터만 받아 WeekView의 의존성 최소화
 *   onPrevWeek         — 이전 주 버튼 클릭 시 호출
 *   onNextWeek         — 다음 주 버튼 클릭 시 호출
 *   onDayClick         — 날짜 셀 클릭 시 호출 (dateKey를 인자로 전달)
 */
function WeekView({ weekBaseDate, selectedDate, todoSummaryByDate, onPrevWeek, onNextWeek, onDayClick }) {
  const weekDays = getWeekDays(weekBaseDate);
  // 오늘 날짜를 map 바깥에서 한 번만 계산 — 셀마다 new Date() 생성 방지
  const todayKey = getTodayKey();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">

      {/* 주 범위 헤더 + 이전/다음 주 버튼 */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="이전 주"
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <span className="text-xs text-gray-500 font-medium">
          {getWeekRangeLabel(weekDays)}
        </span>

        <button
          type="button"
          onClick={onNextWeek}
          aria-label="다음 주"
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* 7개 날짜 셀 */}
      <ul className="flex gap-1">
        {weekDays.map((dateKey, i) => {
          // 집계된 요약 데이터 참조 — todoItems 전체 순회 불필요
          const summary     = todoSummaryByDate[dateKey] || { total: 0, active: 0 };
          const activeCount = summary.active;
          const allDone     = summary.total > 0 && summary.active === 0;

          return (
            <WeekDayCell
              key={dateKey}
              dayName={WEEK_DAY_NAMES[i]}
              date={dateKey}
              activeCount={activeCount}
              allDone={allDone}
              isToday={dateKey === todayKey}
              isSelected={dateKey === selectedDate}
              onClick={() => onDayClick(dateKey)}
            />
          );
        })}
      </ul>

    </div>
  );
}

export default WeekView;
