/* =============================================
   TodoList.jsx — 필터링된 todo 목록 렌더링
   ============================================= */
import TodoItem from './TodoItem';

/**
 * props:
 *   items    — 표시할 todo 배열 (App에서 날짜·필터 적용 후 전달)
 *   onToggle(id)                  — 완료 토글
 *   onSave(id, newText, newDate)  — 수정 저장
 *   onDelete(id)                  — 삭제
 */
function TodoList({ items, onToggle, onSave, onDelete }) {
  // 할 일이 없을 때 빈 상태 메시지 표시
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        이 날의 할 일을 추가해보세요
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
