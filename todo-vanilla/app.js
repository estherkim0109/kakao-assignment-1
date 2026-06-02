/* =============================================
   app.js — Todo 앱 핵심 로직 (Vanilla JS)
   ============================================= */

// ─── DOM 요소 참조 ───────────────────────────
const todoInput      = document.getElementById('todo-input');
const addBtn         = document.getElementById('add-btn');
const todoList       = document.getElementById('todo-list');
const errorMsg       = document.getElementById('error-msg');
const emptyState     = document.getElementById('empty-state');
const summaryTotal   = document.getElementById('summary-total');
const summaryDone    = document.getElementById('summary-done');
const summaryRemain  = document.getElementById('summary-remaining');

// ─── 상태 관리 ───────────────────────────────
// 각 todo 객체: { id, text, isDone }
let todoItems = [];

// 다음 todo에 사용할 고유 ID (단순 증가)
let nextId = 1;

// ─── 초기화 ──────────────────────────────────
renderAll();

// ─── 이벤트 리스너 ───────────────────────────

// 추가 버튼 클릭
addBtn.addEventListener('click', handleAddTodo);

// 입력창에서 Enter 키
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTodo();
});

// 입력 시 오류 메시지 초기화
todoInput.addEventListener('input', clearErrorState);

// ─── 기능 함수 ───────────────────────────────

/**
 * Todo 추가 처리
 * 빈 입력이면 오류 메시지를 표시하고 추가하지 않음
 */
function handleAddTodo() {
  const text = todoInput.value.trim();

  // 빈 입력 유효성 검사
  if (!text) {
    showError('할 일을 입력해주세요.');
    return;
  }

  // 새 todo 객체 생성 후 목록에 추가
  const newTodo = { id: nextId++, text, isDone: false };
  todoItems.push(newTodo);

  // 입력창 초기화 및 오류 상태 제거
  todoInput.value = '';
  clearErrorState();

  renderAll();
}

/**
 * Todo 완료 상태 토글
 * @param {number} id - 대상 todo ID
 */
function toggleDone(id) {
  const todo = findTodoById(id);
  if (!todo) return;

  todo.isDone = !todo.isDone;
  renderAll();
}

/**
 * Todo 수정 모드 활성화
 * 텍스트 대신 입력창을 표시하고 저장 버튼으로 교체
 * @param {number} id - 대상 todo ID
 */
function activateEditMode(id) {
  const listItem = document.querySelector(`[data-id="${id}"]`);
  if (!listItem) return;

  const textEl  = listItem.querySelector('.todo-text');
  const editBtn = listItem.querySelector('.btn-edit');

  // 현재 텍스트 값으로 편집용 input 생성
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'edit-input';
  editInput.value     = textEl.textContent;
  editInput.maxLength = 100;

  // 저장 버튼 생성
  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn-save';
  saveBtn.textContent = '저장';
  saveBtn.addEventListener('click', () => handleSaveEdit(id, editInput));

  // Enter 키로도 저장 가능
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveEdit(id, editInput);
    if (e.key === 'Escape') renderAll(); // Esc 시 편집 취소
  });

  // 텍스트 → 입력창 교체, 수정 버튼 → 저장 버튼 교체
  textEl.replaceWith(editInput);
  editBtn.replaceWith(saveBtn);

  // 편집창에 포커스 및 텍스트 전체 선택
  editInput.focus();
  editInput.select();
}

/**
 * 수정 내용 저장
 * @param {number} id        - 대상 todo ID
 * @param {HTMLInputElement} editInput - 편집 입력창 요소
 */
function handleSaveEdit(id, editInput) {
  const newText = editInput.value.trim();

  // 빈 텍스트로 저장하지 않음
  if (!newText) {
    editInput.focus();
    return;
  }

  const todo = findTodoById(id);
  if (!todo) return;

  todo.text = newText;
  renderAll();
}

/**
 * Todo 삭제
 * @param {number} id - 대상 todo ID
 */
function deleteTodo(id) {
  todoItems = todoItems.filter((todo) => todo.id !== id);
  renderAll();
}

// ─── 렌더링 ──────────────────────────────────

/**
 * 전체 UI 다시 그리기
 * 목록 + 요약 카운트 + 빈 상태 모두 갱신
 */
function renderAll() {
  renderTodoList();
  renderSummary();
  updateEmptyState();
}

/**
 * todo 목록을 DOM에 렌더링
 */
function renderTodoList() {
  todoList.innerHTML = '';

  todoItems.forEach((todo) => {
    const li = createTodoElement(todo);
    todoList.appendChild(li);
  });
}

/**
 * 단일 todo 항목의 li 요소를 생성하여 반환
 * @param {{ id: number, text: string, isDone: boolean }} todo
 * @returns {HTMLLIElement}
 */
function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className  = `todo-item${todo.isDone ? ' is-done' : ''}`;
  li.dataset.id = todo.id;

  // 완료 체크박스
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'complete-checkbox';
  checkbox.checked   = todo.isDone;
  checkbox.setAttribute('aria-label', '완료 처리');
  checkbox.addEventListener('change', () => toggleDone(todo.id));

  // Todo 텍스트
  const textEl = document.createElement('span');
  textEl.className   = 'todo-text';
  textEl.textContent = todo.text;

  // 수정 버튼
  const editBtn = document.createElement('button');
  editBtn.className   = 'btn-edit';
  editBtn.textContent = '수정';
  editBtn.setAttribute('aria-label', '수정');
  editBtn.addEventListener('click', () => activateEditMode(todo.id));

  // 삭제 버튼
  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'btn-delete';
  deleteBtn.textContent = '삭제';
  deleteBtn.setAttribute('aria-label', '삭제');
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  // 버튼 그룹
  const actionGroup = document.createElement('div');
  actionGroup.className = 'action-group';
  actionGroup.append(editBtn, deleteBtn);

  li.append(checkbox, textEl, actionGroup);
  return li;
}

/**
 * 헤더 카운트 요약 갱신
 */
function renderSummary() {
  const total     = todoItems.length;
  const doneCount = todoItems.filter((t) => t.isDone).length;
  const remaining = total - doneCount;

  summaryTotal.innerHTML  = `전체 <strong>${total}</strong>`;
  summaryDone.innerHTML   = `완료 <strong>${doneCount}</strong>`;
  summaryRemain.innerHTML = `남은 것 <strong>${remaining}</strong>`;
}

/**
 * todo가 없을 때 빈 상태 화면 표시/숨김
 */
function updateEmptyState() {
  if (todoItems.length === 0) {
    emptyState.classList.remove('is-hidden');
  } else {
    emptyState.classList.add('is-hidden');
  }
}

// ─── 유틸리티 ────────────────────────────────

/**
 * ID로 todo 객체 찾기
 * @param {number} id
 * @returns {{ id: number, text: string, isDone: boolean } | undefined}
 */
function findTodoById(id) {
  return todoItems.find((todo) => todo.id === id);
}

/**
 * 오류 메시지 표시 및 입력창 오류 스타일 적용
 * @param {string} message - 표시할 안내 문구
 */
function showError(message) {
  errorMsg.textContent = message;
  todoInput.classList.add('is-error');
  todoInput.focus();
}

/**
 * 오류 상태 초기화
 */
function clearErrorState() {
  errorMsg.textContent = '';
  todoInput.classList.remove('is-error');
}