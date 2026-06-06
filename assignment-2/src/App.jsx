/* =============================================
   App.jsx — 루트 컴포넌트, 전역 상태 관리
   ============================================= */
import { useState, useRef, useEffect } from 'react';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';

// 로컬스토리지 키
const STORAGE_KEY_ITEMS  = 'todo_items';
const STORAGE_KEY_NEXTID = 'todo_next_id';

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
  // Date 생성자에서 month는 0-indexed이므로 m - 1
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
      // 파싱 실패 시 빈 배열로 시작
      return [];
    }
  });

  // 현재 선택된 날짜 — 이후 DateNavigator 연동 시 setter 사용
  const [selectedDate, setSelectedDate] = useState(getTodayKey);

  // ─── Refs ───────────────────────────────────
  // nextId는 렌더링에 영향을 주지 않으므로 ref로 관리
  // useRef는 lazy initializer를 지원하지 않아 null 체크로 초기화
  const nextIdRef = useRef(null);
  if (nextIdRef.current === null) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NEXTID);
      nextIdRef.current = saved ? Number(saved) : 1;
    } catch {
      nextIdRef.current = 1;
    }
  }

  // ─── Side Effects ───────────────────────────
  // todoItems가 변경될 때마다 로컬스토리지에 자동 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(todoItems));
  }, [todoItems]);

  // ─── 파생 데이터 ─────────────────────────────
  /** 선택된 날짜에 해당하는 todo만 반환 */
  function getItemsForSelectedDate() {
    return todoItems.filter(t => t.date === selectedDate);
  }

  // ─── 핸들러 ─────────────────────────────────
  /** 새 todo 추가 — 현재 선택된 날짜로 생성 */
  function handleAddTodo(text) {
    const newTodo = {
      id:     nextIdRef.current,
      text,
      isDone: false,
      date:   selectedDate,
    };
    // id 증가 후 즉시 저장 (todoItems useEffect와 별도로 관리)
    nextIdRef.current += 1;
    localStorage.setItem(STORAGE_KEY_NEXTID, String(nextIdRef.current));
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

        {/* todo 목록 */}
        <div className="mt-4">
          <TodoList
            items={getItemsForSelectedDate()}
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
