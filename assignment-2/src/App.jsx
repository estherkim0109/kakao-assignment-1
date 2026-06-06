/* =============================================
   App.jsx — 루트 컴포넌트, 전역 상태 관리
   ============================================= */
import { useState, useCallback, useEffect } from 'react';
import { getTodayKey, shiftDateByDays, getWeekDays } from './utils/date';
import WeekView from './components/WeekView';
import DateNavigator from './components/DateNavigator';
import TodoInput from './components/TodoInput';
import FilterTabs from './components/FilterTabs';
import TodoList from './components/TodoList';

const STORAGE_KEY_ITEMS = 'todo_items';
const STORAGE_KEY_WEEK  = 'todo_week_base'; // 주간 뷰 기준 날짜 저장 키

// 필터별 빈 상태 메시지 — 내용이 변하지 않으므로 모듈 상수로 선언
const EMPTY_MESSAGES = {
  all:    '이 날의 할 일을 추가해보세요',
  active: '진행 중인 할 일이 없어요',
  done:   '완료된 할 일이 없어요',
};

/**
 * 날짜별 todo 목록에 필터를 적용해 반환
 * 'all'일 때는 reduce로 한 번에 분리 후 합침 (이중 순회 방지)
 */
function applyFilter(items, filter) {
  if (filter === 'active') return items.filter(t => !t.isDone);
  if (filter === 'done')   return items.filter(t =>  t.isDone);

  // 'all' — 진행 중을 위로, 완료를 아래로 정렬
  const { active, done } = items.reduce(
    (acc, t) => {
      (t.isDone ? acc.done : acc.active).push(t);
      return acc;
    },
    { active: [], done: [] }
  );
  return [...active, ...done];
}

function App() {
  // ─── State ──────────────────────────────────
  // 전체 todo 목록 — localStorage에서 초기값 복원
  const [todoItems, setTodoItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 현재 선택된 날짜 ('YYYY-MM-DD') — 오늘로 초기화
  const [selectedDate, setSelectedDate] = useState(getTodayKey);

  // 주간 뷰 기준 날짜 — selectedDate와 독립적으로 주간 뷰를 이동할 수 있음
  // localStorage에서 복원해 새로고침 후에도 마지막 위치 유지
  const [weekBaseDate, setWeekBaseDate] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_WEEK) || getTodayKey();
    } catch {
      return getTodayKey();
    }
  });

  // 현재 선택된 필터 ('all' | 'active' | 'done')
  const [currentFilter, setCurrentFilter] = useState('all');

  // ─── 파생 데이터 ─────────────────────────────
  // 선택된 날짜의 todo를 현재 필터로 걸러 표시 목록 생성
  const itemsForDate = todoItems.filter(t => t.date === selectedDate);
  const visibleItems = applyFilter(itemsForDate, currentFilter);

  // 날짜별 todo 요약 집계 — WeekView에 todoItems 전체 대신 요약만 전달
  // todoItems 한 번 순회로 모든 날짜의 { total, active } 를 한꺼번에 계산
  const todoSummaryByDate = todoItems.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { total: 0, active: 0 };
    acc[t.date].total++;
    if (!t.isDone) acc[t.date].active++;
    return acc;
  }, {});

  // ─── Side Effects ───────────────────────────
  // todoItems 변경 시마다 로컬스토리지에 자동 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(todoItems));
  }, [todoItems]);

  // weekBaseDate 변경 시마다 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WEEK, weekBaseDate);
  }, [weekBaseDate]);

  // ─── 핸들러 ─────────────────────────────────
  /** 새 todo 추가 — 현재 선택된 날짜로 생성 */
  const handleAddTodo = useCallback((text) => {
    setTodoItems(prev => {
      const newId = prev.reduce((max, t) => Math.max(max, t.id), 0) + 1;
      return [...prev, { id: newId, text, isDone: false, date: selectedDate }];
    });
  }, [selectedDate]);

  /** 완료 여부 토글 */
  const handleToggleDone = useCallback((id) => {
    setTodoItems(prev =>
      prev.map(t => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  }, []);

  /** 수정 저장 — 텍스트와 날짜 모두 변경 가능 */
  const handleSaveEdit = useCallback((id, newText, newDate) => {
    setTodoItems(prev =>
      prev.map(t =>
        t.id === id ? { ...t, text: newText, date: newDate } : t
      )
    );
  }, []);

  /** todo 삭제 */
  const handleDeleteTodo = useCallback((id) => {
    setTodoItems(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * 날짜를 days일 만큼 이동 (DateNavigator 이전/다음 버튼)
   * 선택 날짜가 현재 주간 뷰를 벗어나면 주간 뷰도 함께 이동
   * DateNavigator는 memo 처리가 안 되어 있으므로 useCallback 미적용
   */
  function handleNavigateDate(days) {
    const next = shiftDateByDays(selectedDate, days);
    setSelectedDate(next);
    setCurrentFilter('all');
    // 이동한 날짜가 현재 주간 뷰 범위 밖이면 weekBaseDate 동기화
    const currentWeekDays = getWeekDays(weekBaseDate);
    if (!currentWeekDays.includes(next)) {
      setWeekBaseDate(next);
    }
  }

  /**
   * 주간 뷰를 days일 만큼 이동 — selectedDate는 변경하지 않음
   * handlePrevWeek / handleNextWeek를 하나로 합쳐 중복 제거
   */
  const handleNavigateWeek = useCallback((days) => {
    setWeekBaseDate(prev => shiftDateByDays(prev, days));
  }, []);

  /**
   * 주간 뷰 날짜 셀 클릭 → 일간 뷰 selectedDate 변경
   * weekBaseDate는 그대로 — 클릭한 날짜는 이미 표시 중인 주에 있음
   */
  const handleWeekDayClick = useCallback((dateKey) => {
    setSelectedDate(dateKey);
    setCurrentFilter('all');
  }, []);

  // ─── 렌더링 ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto py-8 px-4">

        {/* 앱 제목 */}
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Todo</h1>
        </header>

        {/* 주간 뷰 */}
        <div className="mb-3">
          <WeekView
            weekBaseDate={weekBaseDate}
            selectedDate={selectedDate}
            todoSummaryByDate={todoSummaryByDate}
            onPrevWeek={() => handleNavigateWeek(-7)}
            onNextWeek={() => handleNavigateWeek(+7)}
            onDayClick={handleWeekDayClick}
          />
        </div>

        {/* 일간 날짜 네비게이터 */}
        <div className="mb-4">
          <DateNavigator
            selectedDate={selectedDate}
            onPrevDate={() => handleNavigateDate(-1)}
            onNextDate={() => handleNavigateDate(+1)}
          />
        </div>

        {/* todo 입력 영역 */}
        <TodoInput onAdd={handleAddTodo} />

        {/* 필터 탭 */}
        <div className="mt-4">
          <FilterTabs
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
          />
        </div>

        {/* todo 목록 */}
        <div className="mt-3">
          <TodoList
            items={visibleItems}
            emptyMessage={EMPTY_MESSAGES[currentFilter]}
            onToggle={handleToggleDone}
            onSave={handleSaveEdit}
            onDelete={handleDeleteTodo}
          />
        </div>

      </div>
    </div>
  );
}

export default App;
