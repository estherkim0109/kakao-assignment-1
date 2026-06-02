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

// 날짜 네비게이터 요소
const prevDateBtn  = document.getElementById('prev-date-btn');
const nextDateBtn  = document.getElementById('next-date-btn');
const dateLabel    = document.getElementById('date-label');
const todayBadge   = document.getElementById('today-badge');

// 필터 탭
const filterTabs = Array.from(document.querySelectorAll('.filter-tab'));

// 삭제 확인 모달
const deleteModal     = document.getElementById('delete-modal');
const modalPreview    = document.getElementById('modal-preview');
const modalCancelBtn  = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

// ─── 상태 관리 ───────────────────────────────
// 각 todo 객체: { id, text, isDone, date }
// date는 'YYYY-MM-DD' 형식의 문자열로 저장
let todoItems = [];

let nextId          = 1;
let currentFilter   = 'all';
let pendingDeleteId = null;

// 현재 선택된 날짜 (Date 객체)
// 앱 시작 시 오늘 날짜로 초기화
let selectedDate = getTodayDate();

// 로컬스토리지 키 상수
const STORAGE_KEY_ITEMS  = 'todo_items';
const STORAGE_KEY_NEXTID = 'todo_next_id';

// ─── 초기화 ──────────────────────────────────
loadFromStorage(); // 저장된 데이터 먼저 복원
renderDateNav();
renderAll();

// ─── 이벤트 리스너 ───────────────────────────

addBtn.addEventListener('click', handleAddTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTodo();
});

todoInput.addEventListener('input', clearErrorState);

// 이전 날짜 버튼
prevDateBtn.addEventListener('click', () => {
  selectedDate = shiftDate(selectedDate, -1);
  renderDateNav();
  resetFilterToAll();
});

// 다음 날짜 버튼
nextDateBtn.addEventListener('click', () => {
  selectedDate = shiftDate(selectedDate, +1);
  renderDateNav();
  resetFilterToAll();
});

// 필터 탭 — 이벤트 위임
document.querySelector('.filter-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  handleFilterChange(tab.dataset.filter);
});

modalCancelBtn.addEventListener('click', closeDeleteModal);
modalConfirmBtn.addEventListener('click', confirmDelete);

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && deleteModal.classList.contains('is-visible')) {
    closeDeleteModal();
  }
});

// ─── 날짜 관련 함수 ──────────────────────────

/**
 * 오늘 날짜를 시간 없이 반환 (자정 기준 Date 객체)
 * @returns {Date}
 */
function getTodayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Date 객체를 'YYYY-MM-DD' 문자열로 변환
 * @param {Date} date
 * @returns {string}
 */
function formatDateKey(date) {
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Date 객체를 화면에 표시할 한국어 형식으로 변환
 * 예: "2025년 6월 2일 (월)"
 * @param {Date} date
 * @returns {string}
 */
function formatDateDisplay(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y    = date.getFullYear();
  const m    = date.getMonth() + 1;
  const d    = date.getDate();
  const day  = days[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${day})`;
}

/**
 * 날짜를 n일만큼 이동한 새 Date 반환 (원본 불변)
 * @param {Date} date
 * @param {number} days - 양수: 이후, 음수: 이전
 * @returns {Date}
 */
function shiftDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * 선택된 날짜가 오늘인지 확인
 * @returns {boolean}
 */
function isSelectedDateToday() {
  return formatDateKey(selectedDate) === formatDateKey(getTodayDate());
}

// ─── 기능 함수 ───────────────────────────────

/**
 * Todo 추가 — 현재 선택된 날짜를 함께 저장
 */
function handleAddTodo() {
  const text = todoInput.value.trim();

  if (!text) {
    showError('할 일을 입력해주세요.');
    return;
  }

  const newTodo = {
    id:     nextId++,
    text,
    isDone: false,
    date:   formatDateKey(selectedDate), // 선택된 날짜 저장
  };
  todoItems.push(newTodo);

  todoInput.value = '';
  clearErrorState();

  saveToStorage(); // 추가 후 저장

  // 완료 탭에서 추가하면 전체 탭으로 전환
  if (currentFilter === 'done') {
    handleFilterChange('all');
  } else {
    renderAll();
  }
}

/**
 * Todo 완료 토글
 * @param {number} id
 */
function toggleDone(id) {
  const todo = findTodoById(id);
  if (!todo) return;
  todo.isDone = !todo.isDone;
  saveToStorage(); // 완료 상태 변경 후 저장
  renderAll();
}

/**
 * 수정 모드 활성화
 * 텍스트 입력창 + 날짜 선택 input[type=date] 를 함께 표시
 * @param {number} id
 */
function activateEditMode(id) {
  const listItem = document.querySelector(`[data-id="${id}"]`);
  if (!listItem) return;

  const todo    = findTodoById(id);
  const textEl  = listItem.querySelector('.todo-text');
  const editBtn = listItem.querySelector('.btn-edit');

  // ── 텍스트 편집 input ──
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'edit-input';
  editInput.value     = todo.text;
  editInput.maxLength = 100;

  // ── 날짜 편집 input[type=date] ──
  const dateInput = document.createElement('input');
  dateInput.type      = 'date';
  dateInput.className = 'edit-date-input';
  dateInput.value     = todo.date; // 현재 저장된 날짜로 초기값 세팅

  // 텍스트 + 날짜를 세로로 묶는 래퍼
  const editWrapper = document.createElement('div');
  editWrapper.className = 'edit-wrapper';
  editWrapper.append(editInput, dateInput);

  // ── 저장 버튼 ──
  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn-save';
  saveBtn.textContent = '저장';
  saveBtn.addEventListener('click', () => handleSaveEdit(id, editInput, dateInput));

  // Enter로 저장, Escape로 취소
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  handleSaveEdit(id, editInput, dateInput);
    if (e.key === 'Escape') renderAll();
  });

  // 텍스트 span → 편집 래퍼로 교체, 수정 버튼 → 저장 버튼으로 교체
  textEl.replaceWith(editWrapper);
  editBtn.replaceWith(saveBtn);

  editInput.focus();
  editInput.select();
}

/**
 * 수정 저장 — 텍스트와 날짜 모두 반영
 * @param {number} id
 * @param {HTMLInputElement} editInput   - 텍스트 입력창
 * @param {HTMLInputElement} dateInput   - 날짜 선택 input
 */
function handleSaveEdit(id, editInput, dateInput) {
  const newText = editInput.value.trim();
  if (!newText) { editInput.focus(); return; }

  const todo = findTodoById(id);
  if (!todo) return;

  todo.text = newText;

  // 날짜가 선택되어 있으면 업데이트 (비어 있으면 기존 날짜 유지)
  if (dateInput.value) {
    todo.date = dateInput.value;
  }

  saveToStorage(); // 수정 후 저장
  renderAll();
}

/**
 * 필터 탭 변경
 * @param {string} filter - 'all' | 'active' | 'done'
 */
function handleFilterChange(filter) {
  currentFilter = filter;

  filterTabs.forEach((tab) => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  renderAll();
}

/**
 * 날짜 이동 시 필터를 '전체'로 초기화
 */
function resetFilterToAll() {
  handleFilterChange('all');
}

/**
 * 현재 선택 날짜 + 필터 기준으로 표시할 todo 반환
 * @returns {Array}
 */
function getFilteredItems() {
  const dateKey = formatDateKey(selectedDate);

  // 1단계: 선택된 날짜의 항목만 추림
  const byDate = todoItems.filter((t) => t.date === dateKey);

  // 2단계: 상태 필터 적용 + 완료 항목은 하단 정렬
  switch (currentFilter) {
    case 'active':
      return byDate.filter((t) => !t.isDone);
    case 'done':
      return byDate.filter((t) =>  t.isDone);
    default: {
      // '전체': 진행 중 위 / 완료 아래
      const active = byDate.filter((t) => !t.isDone);
      const done   = byDate.filter((t) =>  t.isDone);
      return [...active, ...done];
    }
  }
}

/**
 * 삭제 모달 열기
 * @param {number} id
 */
function requestDeleteTodo(id) {
  const todo = findTodoById(id);
  if (!todo) return;
  pendingDeleteId = id;
  modalPreview.textContent = todo.text;
  openDeleteModal();
}

function openDeleteModal() {
  deleteModal.classList.add('is-visible');
  modalConfirmBtn.focus();
}

function closeDeleteModal() {
  deleteModal.classList.remove('is-visible');
  pendingDeleteId = null;
}

function confirmDelete() {
  if (pendingDeleteId === null) return;
  todoItems = todoItems.filter((t) => t.id !== pendingDeleteId);
  saveToStorage(); // 삭제 후 저장
  closeDeleteModal();
  renderAll();
}

// ─── 렌더링 ──────────────────────────────────

/**
 * 날짜 네비게이터 UI 갱신
 * 선택 날짜 텍스트 및 '오늘' 뱃지 표시 여부 업데이트
 */
function renderDateNav() {
  dateLabel.textContent = formatDateDisplay(selectedDate);

  if (isSelectedDateToday()) {
    todayBadge.classList.remove('is-hidden');
  } else {
    todayBadge.classList.add('is-hidden');
  }
}

/** 전체 UI 갱신 */
function renderAll() {
  renderTodoList();
  renderSummary();
  updateEmptyState();
}

/** 필터링된 목록 렌더링 */
function renderTodoList() {
  todoList.innerHTML = '';
  getFilteredItems().forEach((todo) => {
    todoList.appendChild(createTodoElement(todo));
  });
}

/**
 * 단일 todo li 요소 생성
 * @param {{ id, text, isDone, date }} todo
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
  editBtn.addEventListener('click', () => activateEditMode(todo.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'btn-delete';
  deleteBtn.textContent = '삭제';
  deleteBtn.addEventListener('click', () => requestDeleteTodo(todo.id));

  const actionGroup = document.createElement('div');
  actionGroup.className = 'action-group';
  actionGroup.append(editBtn, deleteBtn);

  li.append(checkbox, textEl, actionGroup);
  return li;
}

/**
 * 요약 카운트 갱신 — 선택된 날짜 기준
 */
function renderSummary() {
  const dateKey   = formatDateKey(selectedDate);
  const byDate    = todoItems.filter((t) => t.date === dateKey);
  const total     = byDate.length;
  const doneCount = byDate.filter((t) => t.isDone).length;
  const remaining = total - doneCount;

  summaryTotal.innerHTML  = `전체 <strong>${total}</strong>`;
  summaryDone.innerHTML   = `완료 <strong>${doneCount}</strong>`;
  summaryRemain.innerHTML = `남은 것 <strong>${remaining}</strong>`;
}

/**
 * 빈 상태 표시/숨김 — 필터별 안내 문구 분기
 */
function updateEmptyState() {
  const filtered = getFilteredItems();

  if (filtered.length === 0) {
    emptyState.classList.remove('is-hidden');
    const messages = {
      all:    '이 날의 할 일을 추가해보세요',
      active: '진행 중인 할 일이 없어요',
      done:   '완료된 할 일이 없어요',
    };
    emptyMsg.textContent = messages[currentFilter];
  } else {
    emptyState.classList.add('is-hidden');
  }
}

// ─── 로컬스토리지 ──────────────────────────

/**
 * 현재 todoItems와 nextId를 로컬스토리지에 저장
 * JSON.stringify로 직렬화해서 문자열로 보관
 */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY_ITEMS,  JSON.stringify(todoItems));
  localStorage.setItem(STORAGE_KEY_NEXTID, String(nextId));
}

/**
 * 로컬스토리지에서 데이터를 불러와 상태 복원
 * 저장된 데이터가 없으면 기본 초기값 유지
 */
function loadFromStorage() {
  try {
    const savedItems  = localStorage.getItem(STORAGE_KEY_ITEMS);
    const savedNextId = localStorage.getItem(STORAGE_KEY_NEXTID);

    if (savedItems) {
      // JSON.parse로 역직렬화해 배열 복원
      todoItems = JSON.parse(savedItems);
    }
    if (savedNextId) {
      nextId = Number(savedNextId);
    }
  } catch (e) {
    // 파싱 오류 시 초기값으로 안전하게 복원
    console.warn('로컬스토리지 복원 실패, 초기화합니다.', e);
    todoItems = [];
    nextId    = 1;
  }
}

// ─── 유틸리티 ────────────────────────────────

function findTodoById(id) {
  return todoItems.find((t) => t.id === id);
}

function showError(message) {
  errorMsg.textContent = message;
  todoInput.classList.add('is-error');
  todoInput.focus();
}

function clearErrorState() {
  errorMsg.textContent = '';
  todoInput.classList.remove('is-error');
}