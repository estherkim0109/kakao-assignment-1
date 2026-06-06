/* =============================================
   App.jsx — 루트 컴포넌트, 전역 상태 관리
   ============================================= */
import { useState, useRef, useEffect } from 'react';
import { getTodayKey, shiftDateByDays } from './utils/date';
import DateNavigator from './components/DateNavigator';
import TodoInput from './components/TodoInput';
import FilterTabs from './components/FilterTabs';
import TodoList from './components/TodoList';

const STORAGE_KEY_ITEMS = 'todo_items';

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

  // 현재 선택된 필터 ('all' | 'active' | 'done')
  const [currentFilter, setCurrentFilter] = useState('all');

  // ─── 파생 데이터 ─────────────────────────────
  // nextId를 todoItems에서 직접 파생 — 별도 ref/localStorage 불필요
  const nextId = todoItems.reduce((max, t) => Math.max(max, t.id), 0) + 1;

  // 선택된 날짜의 todo를 현재 필터로 걸러 표시 목록 생성
  const itemsForDate = todoItems.filter(t => t.date === selectedDate);
  const visibleItems = applyFilter(itemsForDate, currentFilter);

  // ─── Side Effects ───────────────────────────
  // 마운트 시 초기 로드 직후의 불필요한 저장을 건너뜀
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(todoItems));
  }, [todoItems]);

  // ─── 핸들러 ─────────────────────────────────
  /** 새 todo 추가 — 현재 선택된 날짜로 생성 */
  function handleAddTodo(text) {
    const newTodo = {
      id:     nextId,
      text,
      isDone: false,
      date:   selectedDate, // 선택된 날짜에 귀속
    };
    setTodoItems(prev => [...prev, newTodo]);
  }

  /** 완료 여부 토글 */
  function handleToggleDone(id) {
    setTodoItems(prev =>
      prev.map(t => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  }

  /** 수정 저장 — 텍스트와 날짜 모두 변경 가능
   * 날짜가 바뀌면 해당 todo는 변경된 날짜의 목록에 표시됨 */
  function handleSaveEdit(id, newText, newDate) {
    setTodoItems(prev =>
      prev.map(t =>
        t.id === id ? { ...t, text: newText, date: newDate } : t
      )
    );
  }

  /** todo 삭제 */
  function handleDeleteTodo(id) {
    setTodoItems(prev => prev.filter(t => t.id !== id));
  }

  /** 필터 탭 변경 */
  function handleFilterChange(filter) {
    setCurrentFilter(filter);
  }

  /**
   * 날짜를 days일 만큼 이동
   * 날짜가 바뀌면 필터를 '전체'로 초기화 — 새 날짜의 전체 목록을 보여주는 것이 자연스러움
   * handlePrevDate / handleNextDate를 하나로 합쳐 로직 중복 제거
   */
  function handleNavigateDate(days) {
    setSelectedDate(prev => shiftDateByDays(prev, days));
    setCurrentFilter('all');
  }

  // ─── 렌더링 ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto py-8 px-4">

        {/* 앱 제목 */}
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Todo</h1>
        </header>

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
            onFilterChange={handleFilterChange}
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
