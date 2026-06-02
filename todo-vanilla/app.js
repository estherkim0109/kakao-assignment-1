/* =============================================
   app.js — Todo 앱 핵심 로직 (Vanilla JS)
   ============================================= */

// ─── DOM 요소 참조 ───────────────────────────
const todoInput      = document.getElementById('todo-input');
const addBtn         = document.getElementById('add-btn');
const todoList       = document.getElementById('todo-list');
const errorMsg       = document.getElementById('error-msg');
const emptyState     = document.getElementById('empty-state');
const emptyMsg       = document.getElementById('empty-msg');
const summaryTotal   = document.getElementById('summary-total');
const summaryDone    = document.getElementById('summary-done');
const summaryRemain  = document.getElementById('summary-remaining');

// 필터 탭 버튼 목록 (NodeList → Array)
const filterTabs = Array.from(document.querySelectorAll('.filter-tab'));

// 삭제 확인 모달 관련 요소
const deleteModal     = document.getElementById('delete-modal');
const modalPreview    = document.getElementById('modal-preview');
const modalCancelBtn  = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

// ─── 상태 관리 ───────────────────────────────
// 각 todo 객체: { id, text, isDone }
let todoItems = [];

// 다음 todo에 사용할 고유 ID (단순 증가)
let nextId = 1;

// 현재 활성화된 필터: 'all' | 'active' | 'done'
let currentFilter = 'all';

// 현재 삭제 대기 중인 todo ID
let pendingDeleteId = null;

// ─── 초기화 ──────────────────────────────────
renderAll();

// ─── 이벤트 리스너 ───────────────────────────

// 추가 버튼 클릭
addBtn.addEventListener('click', handleAddTodo);

// 입력창 Enter 키
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTodo();
});

// 입력 시 오류 메시지 초기화
todoInput.addEventListener('input', clearErrorState);

// 필터 탭 클릭 — 이벤트 위임
document.querySelector('.filter-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  handleFilterChange(tab.dataset.filter);
});

// 모달 — 취소
modalCancelBtn.addEventListener('click', closeDeleteModal);

// 모달 — 삭제 확인
modalConfirmBtn.addEventListener('click', confirmDelete);

// 모달 — 배경 클릭으로 닫기
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});

// 모달 — ESC 키로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && deleteModal.classList.contains('is-visible')) {
    closeDeleteModal();
  }
});

// ─── 기능 함수 ───────────────────────────────

/**
 * Todo 추가 처리
 */
function handleAddTodo() {
  const text = todoInput.value.trim();

  if (!text) {
    showError('할 일을 입력해주세요.');
    return;
  }

  const newTodo = { id: nextId++, text, isDone: false };
  todoItems.push(newTodo);

  todoInput.value = '';
  clearErrorState();

  // 새 항목이 보이도록 '전체' 또는 '진행 중' 탭으로 이동
  if (currentFilter === 'done') {
    handleFilterChange('all');
  } else {
    renderAll();
  }
}

/**
 * Todo 완료 상태 토글
 * @param {number} id
 */
function toggleDone(id) {
  const todo = findTodoById(id);
  if (!todo) return;

  todo.isDone = !todo.isDone;
  renderAll();
}

/**
 * Todo 수정 모드 활성화
 * @param {number} id
 */
function activateEditMode(id) {
  const listItem = document.querySelector(`[data-id="${id}"]`);
  if (!listItem) return;

  const textEl  = listItem.querySelector('.todo-text');
  const editBtn = listItem.querySelector('.btn-edit');

  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'edit-input';
  editInput.value     = textEl.textContent;
  editInput.maxLength = 100;

  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn-save';
  saveBtn.textContent = '저장';
  saveBtn.addEventListener('click', () => handleSaveEdit(id, editInput));

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  handleSaveEdit(id, editInput);
    if (e.key === 'Escape') renderAll();
  });

  textEl.replaceWith(editInput);
  editBtn.replaceWith(saveBtn);

  editInput.focus();
  editInput.select();
}

/**
 * 수정 내용 저장
 * @param {number} id
 * @param {HTMLInputElement} editInput
 */
function handleSaveEdit(id, editInput) {
  const newText = editInput.value.trim();
  if (!newText) { editInput.focus(); return; }

  const todo = findTodoById(id);
  if (!todo) return;

  todo.text = newText;
  renderAll();
}

/**
 * 필터 탭 변경 처리
 * 탭 활성 스타일을 업데이트하고 목록을 다시 그림
 * @param {string} filter - 'all' | 'active' | 'done'
 */
function handleFilterChange(filter) {
  currentFilter = filter;

  // 탭 활성 클래스 및 aria-selected 갱신
  filterTabs.forEach((tab) => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  renderAll();
}

/**
 * 현재 필터에 맞는 todo 목록 반환
 * @returns {Array}
 */
function getFilteredItems() {
  switch (currentFilter) {
    case 'active': return todoItems.filter((t) => !t.isDone);
    case 'done':   return todoItems.filter((t) =>  t.isDone);
    default: {
      // '전체' 탭: 진행 중 항목을 위에, 완료 항목을 아래에 표시
      const active = todoItems.filter((t) => !t.isDone);
      const done   = todoItems.filter((t) =>  t.isDone);
      return [...active, ...done];
    }
  }
}

/**
 * 삭제 확인 모달 열기
 * @param {number} id
 */
function requestDeleteTodo(id) {
  const todo = findTodoById(id);
  if (!todo) return;

  pendingDeleteId = id;
  modalPreview.textContent = todo.text;
  openDeleteModal();
}

/** 모달 표시 */
function openDeleteModal() {
  deleteModal.classList.add('is-visible');
  modalConfirmBtn.focus();
}

/** 모달 닫기 */
function closeDeleteModal() {
  deleteModal.classList.remove('is-visible');
  pendingDeleteId = null;
}

/** 삭제 확인 후 실제 삭제 수행 */
function confirmDelete() {
  if (pendingDeleteId === null) return;

  todoItems = todoItems.filter((todo) => todo.id !== pendingDeleteId);

  closeDeleteModal();
  renderAll();
}

// ─── 렌더링 ──────────────────────────────────

/**
 * 전체 UI 갱신
 */
function renderAll() {
  renderTodoList();
  renderSummary();
  updateEmptyState();
}

/**
 * 필터링된 todo 목록을 DOM에 렌더링
 */
function renderTodoList() {
  todoList.innerHTML = '';

  getFilteredItems().forEach((todo) => {
    const li = createTodoElement(todo);
    todoList.appendChild(li);
  });
}

/**
 * 단일 todo li 요소 생성
 * @param {{ id: number, text: string, isDone: boolean }} todo
 * @returns {HTMLLIElement}
 */
function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className  = `todo-item${todo.isDone ? ' is-done' : ''}`;
  li.dataset.id = todo.id;

  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'complete-checkbox';
  checkbox.checked   = todo.isDone;
  checkbox.setAttribute('aria-label', '완료 처리');
  checkbox.addEventListener('change', () => toggleDone(todo.id));

  const textEl = document.createElement('span');
  textEl.className   = 'todo-text';
  textEl.textContent = todo.text;

  const editBtn = document.createElement('button');
  editBtn.className   = 'btn-edit';
  editBtn.textContent = '수정';
  editBtn.setAttribute('aria-label', '수정');
  editBtn.addEventListener('click', () => activateEditMode(todo.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'btn-delete';
  deleteBtn.textContent = '삭제';
  deleteBtn.setAttribute('aria-label', '삭제');
  deleteBtn.addEventListener('click', () => requestDeleteTodo(todo.id));

  const actionGroup = document.createElement('div');
  actionGroup.className = 'action-group';
  actionGroup.append(editBtn, deleteBtn);

  li.append(checkbox, textEl, actionGroup);
  return li;
}

/**
 * 헤더 요약 카운트 갱신 (항상 전체 기준)
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
 * 빈 상태 표시/숨김
 * 현재 필터 기준으로 표시할 항목이 없을 때 안내 문구를 바꿔서 표시
 */
function updateEmptyState() {
  const filtered = getFilteredItems();

  if (filtered.length === 0) {
    emptyState.classList.remove('is-hidden');

    // 필터별 안내 문구
    const messages = {
      all:    '할 일을 추가해보세요',
      active: '진행 중인 할 일이 없어요',
      done:   '완료된 할 일이 없어요',
    };
    emptyMsg.textContent = messages[currentFilter];
  } else {
    emptyState.classList.add('is-hidden');
  }
}

// ─── 유틸리티 ────────────────────────────────

/**
 * ID로 todo 객체 찾기
 * @param {number} id
 */
function findTodoById(id) {
  return todoItems.find((todo) => todo.id === id);
}

/**
 * 오류 메시지 표시
 * @param {string} message
 */
function showError(message) {
  errorMsg.textContent = message;
  todoInput.classList.add('is-error');
  todoInput.focus();
}

/** 오류 상태 초기화 */
function clearErrorState() {
  errorMsg.textContent = '';
  todoInput.classList.remove('is-error');
}