/* =============================================
   TodoList.jsx — 필터링된 todo 목록 렌더링
   ============================================= */
import TodoItem from './TodoItem';

/**
 * props:
 *   items        — 표시할 todo 배열 (App에서 날짜·필터 적용 후 전달)
 *   emptyMessage — 항목이 없을 때 표시할 메시지 (필터 상태에 따라 다름)
 *   onToggle(id)                  — 완료 토글
 *   onSave(id, newText, newDate)  — 수정 저장
 *   onDelete(id)                  — 삭제
 */
function TodoList({ items, emptyMessage, onToggle, onSave, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TodoList;
