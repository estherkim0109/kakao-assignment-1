/* =============================================
   TodoItem.jsx — 개별 todo 항목 (일반 뷰 / 편집 뷰)
   ============================================= */
import { useState } from 'react';

/**
 * props:
 *   todo                          — { id, text, isDone, date }
 *   onToggle(id)                  — 완료 토글
 *   onSave(id, newText, newDate)  — 수정 저장
 *   onDelete(id)                  — 삭제
 */
function TodoItem({ todo, onToggle, onSave, onDelete }) {
  // 편집 모드 여부 — TodoItem이 직접 관리
  const [isEditing, setIsEditing] = useState(false);
  // 편집 중인 텍스트와 날짜 — 편집 시작 시 현재 값으로 초기화
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');

  /** 편집 모드 진입 — 입력창을 현재 값으로 초기화 */
  function handleEditStart() {
    setEditText(todo.text);
    setEditDate(todo.date);
    setIsEditing(true);
  }

  /** 편집 취소 — 값을 되돌리지 않아도 됨 (다음 진입 시 초기화됨) */
  function handleCancelEdit() {
    setIsEditing(false);
  }

  /** 편집 저장 — 텍스트가 빈 문자열이면 저장하지 않음 */
  function handleSave() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    // 날짜가 지워진 경우 원래 날짜 유지
    onSave(todo.id, trimmed, editDate || todo.date);
    setIsEditing(false);
  }

  /** 텍스트 입력창 키 이벤트 — Enter: 저장, Escape: 취소 */
  function handleKeyDown(e) {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') handleCancelEdit();
  }

  // ─── 편집 뷰 ────────────────────────────────
  if (isEditing) {
    return (
      <li className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
        {/* 할 일 텍스트 수정 입력창 */}
        <input
          type="text"
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={100}
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* 날짜 변경 입력창 — 변경 시 해당 날짜의 목록으로 이동 */}
        <input
          type="date"
          value={editDate}
          onChange={e => setEditDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={handleSave}
          className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
        >
          저장
        </button>
        <button
          type="button"
          onClick={handleCancelEdit}
          className="text-gray-400 px-2 py-1 rounded text-xs hover:text-gray-600 transition-colors"
        >
          취소
        </button>
      </li>
    );
  }

  // ─── 일반 뷰 ────────────────────────────────
  return (
    <li className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
      {/* 완료 체크박스 */}
      <input
        type="checkbox"
        checked={todo.isDone}
        onChange={() => onToggle(todo.id)}
        aria-label="완료 처리"
        className="w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0"
      />

      {/* 할 일 텍스트 — 완료 시 취소선 + 흐린 색상 */}
      <span
        className={`flex-1 text-sm break-all ${
          todo.isDone ? 'line-through text-gray-400' : 'text-gray-700'
        }`}
      >
        {todo.text}
      </span>

      {/* 액션 버튼 그룹 */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={handleEditStart}
          className="text-xs text-gray-400 hover:text-blue-500 px-2 py-1 rounded transition-colors"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded transition-colors"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

export default TodoItem;
