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
  // draft가 null이면 일반 뷰, 객체이면 편집 뷰
  // — isEditing/editText/editDate 세 state를 하나로 통합해 상태 불일치를 방지
  const [draft, setDraft] = useState(null);

  /** 편집 모드 진입 — 현재 todo 값으로 draft 초기화 */
  function handleEditStart() {
    setDraft({ text: todo.text, date: todo.date });
  }

  /** 편집 취소 */
  function handleCancelEdit() {
    setDraft(null);
  }

  /** 편집 저장 — 텍스트가 빈 문자열이면 저장하지 않음 */
  function handleSave() {
    const trimmed = draft.text.trim();
    if (!trimmed) return;
    // 날짜가 지워진 경우 원래 날짜 유지
    onSave(todo.id, trimmed, draft.date || todo.date);
    setDraft(null);
  }

  /** 텍스트 입력창 키 이벤트 — Enter: 저장, Escape: 취소 */
  function handleKeyDown(e) {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') handleCancelEdit();
  }

  // ─── 편집 뷰 ────────────────────────────────
  if (draft !== null) {
    return (
      <li className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
        {/* 할 일 텍스트 수정 입력창 */}
        <input
          type="text"
          value={draft.text}
          onChange={e => setDraft(prev => ({ ...prev, text: e.target.value }))}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={100}
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* 날짜 변경 입력창 — 변경 시 해당 날짜의 목록으로 이동 */}
        <input
          type="date"
          value={draft.date}
          onChange={e => setDraft(prev => ({ ...prev, date: e.target.value }))}
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
