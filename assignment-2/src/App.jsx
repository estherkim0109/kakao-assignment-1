/* =============================================
   App.jsx — 루트 컴포넌트, 전역 상태 관리
   ============================================= */
import { useState, useRef, useEffect } from 'react';
import TodoInput from './components/TodoInput';
import FilterTabs from './components/FilterTabs';
import TodoList from './components/TodoList';

const STORAGE_KEY_ITEMS = 'todo_items';

/** 오늘 날짜를 'YYYY-MM-DD' 문자열로 반환 */
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' 문자열을 한국어 표시 형식으로 변환 (예: "2025년 6월 7일 (토)") */
function formatDateDisplay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${y}년 ${m}월 ${d}일 (${dayNames[date.getDay()]})`;
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

  // 현재 선택된 날짜 — DateNavigator 구현 시 setter 추가 예정
  const [selectedDate] = useState(getTodayKey);

  // 현재 선택된 필터 ('all' | 'active' | 'done')
  const [currentFilter, setCurrentFilter] = useState('all');

  // ─── 파생 데이터 ─────────────────────────────
  // nextId를 todoItems에서 직접 파생 — 별도 ref/localStorage 불필요
  // reduce로 순회해 가장 큰 id + 1을 사용 (spread 방식은 배열이 클 때 스택 오버플로 위험)
  const nextId = todoItems.reduce((max, t) => Math.max(max, t.id), 0) + 1;

  // 선택된 날짜의 todo를 현재 필터로 걸러 표시 목록 생성
  const itemsForDate = todoItems.filter(t => t.date === selectedDate);
  const visibleItems = (() => {
    switch (currentFilter) {
      case 'active': return itemsForDate.filter(t => !t.isDone);
      case 'done':   return itemsForDate.filter(t =>  t.isDone);
      default:       // 'all' — 진행 중을 위로, 완료를 아래로 정렬
        return [
          ...itemsForDate.filter(t => !t.isDone),
          ...itemsForDate.filter(t =>  t.isDone),
        ];
    }
  })();

  // 필터별 빈 상태 메시지
  const emptyMessages = {
    all:    '이 날의 할 일을 추가해보세요',
    active: '진행 중인 할 일이 없어요',
    done:   '완료된 할 일이 없어요',
  };

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
      date:   selectedDate,
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

  // ─── 렌더링 ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto py-8 px-4">

        {/* 헤더 — 선택된 날짜 표시 */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Todo</h1>
          <p className="text-sm text-gray-400 mt-1">{formatDateDisplay(selectedDate)}</p>
        </header>

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
            emptyMessage={emptyMessages[currentFilter]}
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
