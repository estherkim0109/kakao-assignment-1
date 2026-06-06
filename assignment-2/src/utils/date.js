/* =============================================
   utils/date.js — 날짜 관련 순수 유틸리티
   여러 컴포넌트에서 공유하므로 별도 모듈로 분리
   ============================================= */

// 요일 이름 — 매 호출마다 생성하지 않도록 모듈 상수로 선언
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Date 객체 → 'YYYY-MM-DD' 문자열
 * WeekView 등 다른 컴포넌트에서도 사용하므로 export
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 오늘 날짜를 'YYYY-MM-DD' 문자열로 반환 */
export function getTodayKey() {
  return formatDateKey(new Date());
}

/**
 * 'YYYY-MM-DD' → 한국어 표시 문자열
 * 예: "2025년 6월 7일 (토)"
 */
export function formatDateDisplay(dateKey) {
  // split으로 파싱해 Date 생성 — month는 0-indexed이므로 m - 1
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}년 ${m}월 ${d}일 (${DAY_NAMES[date.getDay()]})`;
}

/**
 * 날짜를 days일 만큼 이동한 새 날짜 키 반환
 * 예: shiftDateByDays('2025-06-07', -1) → '2025-06-06'
 */
export function shiftDateByDays(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

/** 주어진 날짜 키가 오늘인지 확인 */
export function isToday(dateKey) {
  return dateKey === getTodayKey();
}

// ─── 주간 뷰 전용 유틸리티 ─────────────────────

/**
 * 주어진 날짜가 속한 주의 월요일 날짜 키 반환
 * JS getDay()는 0=일요일 기준이므로 월요일 기준으로 보정
 * 예: 수요일(3) → offset = 1-3 = -2 → 2일 전이 월요일
 */
export function getWeekMonday(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay(); // 0=일, 1=월, ..., 6=토
  const offset = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

/**
 * 기준 날짜가 속한 주의 월~일 날짜 키 배열(7개) 반환
 * 예: '2025-06-07' → ['2025-06-02', ..., '2025-06-08']
 */
export function getWeekDays(dateKey) {
  const monday = getWeekMonday(dateKey);
  return Array.from({ length: 7 }, (_, i) => shiftDateByDays(monday, i));
}

/**
 * 'YYYY-MM-DD' → 짧은 날짜 표시 (예: "6/7")
 * 주간 뷰 셀처럼 공간이 좁은 곳에 사용
 */
export function formatDateShort(dateKey) {
  const [, m, d] = dateKey.split('-').map(Number);
  return `${m}/${d}`;
}
