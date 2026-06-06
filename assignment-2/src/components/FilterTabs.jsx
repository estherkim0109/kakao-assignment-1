/* =============================================
   FilterTabs.jsx — 전체 / 진행 중 / 완료 필터 탭
   ============================================= */

// 탭 목록을 상수로 분리해 렌더 함수가 깔끔해짐
// value는 App의 currentFilter와 대응되는 식별자
// key 대신 value를 사용 — React의 예약 prop 이름 key와 혼동 방지
const FILTERS = [
  { value: 'all',    label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'done',   label: '완료' },
];

/**
 * props:
 *   currentFilter   — 현재 선택된 필터 키 ('all' | 'active' | 'done')
 *   onFilterChange  — 탭 클릭 시 호출 (filter 키를 인자로 전달)
 */
function FilterTabs({ currentFilter, onFilterChange }) {
  return (
    // role="tablist" — 스크린리더에 탭 그룹임을 알림
    <div role="tablist" className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {FILTERS.map(({ value, label }) => {
        const isActive = currentFilter === value;
        return (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onFilterChange(value)}
            className={`flex-1 py-1.5 text-sm rounded-md text-center transition-colors ${
              isActive
                ? 'bg-white text-blue-600 font-medium shadow-sm'  // 선택된 탭
                : 'text-gray-500 hover:text-gray-700'              // 미선택 탭
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
