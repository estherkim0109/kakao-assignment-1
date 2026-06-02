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

// 주간 뷰 요소
const prevWeekBtn      = document.getElementById('prev-week-btn');
const nextWeekBtn      = document.getElementById('next-week-btn');
const weekRangeLabel   = document.getElementById('week-range-label');
const weekDaysEl       = document.getElementById('week-days');

// 일간 날짜 네비게이터 요소
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
let todoItems = [];

let nextId          = 1;
let currentFilter   = 'all';
let pendingDeleteId = null;

// 현재 선택된 날짜 (Date 객체) — 오늘로 초기화
let selectedDate = getTodayDate();

// 주간 뷰의 기준 날짜: 이 날짜가 속한 주를 표시
// 오늘이 속한 주로 초기화
let weekBaseDate = getTodayDate();

// 로컬스토리지 키 상수
const STORAGE_KEY_ITEMS  = 'todo_items';
const STORAGE_KEY_NEXTID = 'todo_next_id';

// ─── 초기화 ──────────────────────────────────
loadFromStorage();
renderWeekNav();
renderDateNav();
renderAll();

// ─── 이벤트 리스너 ───────────────────────────

addBtn.addEventListener('click', handleAddTodo);

todoInput.addEventListener('keydown', (e) => {
  // e.isComposing: 한글 등 IME 조합 중일 때 true → 조합 완성 Enter 이벤트 무시
  if (e.isComposing) return;
  if (e.key === 'Enter') handleAddTodo();
});

todoInput.addEventListener('input', clearErrorState);

// 주간 뷰 — 이전 주
prevWeekBtn.addEventListener('click', () => {
  weekBaseDate = shiftDate(weekBaseDate, -7);
  renderWeekNav();
});

// 주간 뷰 — 다음 주
nextWeekBtn.addEventListener('click', () => {
  weekBaseDate = shiftDate(weekBaseDate, +7);
  renderWeekNav();
});

// 일간 네비게이터 — 이전 날짜
prevDateBtn.addEventListener('click', () => {
  selectedDate = shiftDate(selectedDate, -1);
  // 선택 날짜가 현재 주간 뷰 범위를 벗어나면 주간 뷰도 이동
  syncWeekToSelectedDate();
  renderWeekNav();
  renderDateNav();
  resetFilterToAll();
});

// 일간 네비게이터 — 다음 날짜
nextDateBtn.addEventListener('click', () => {
  selectedDate = shiftDate(selectedDate, +1);
  syncWeekToSelectedDate();
  renderWeekNav();
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
 * 오늘 날짜를 자정 기준 Date 객체로 반환
 */
function getTodayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Date → 'YYYY-MM-DD' 문자열
 */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Date → 한국어 표시 문자열 (예: "2025년 6월 2일 (월)")
 */
function formatDateDisplay(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

/**
 * Date → 짧은 표시 문자열 (예: "6/2")
 */
function formatDateShort(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 날짜를 n일 이동한 새 Date 반환 (원본 불변)
 */
function shiftDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * 주어진 날짜가 속한 주의 월요일을 반환
 * JS의 getDay()는 0=일요일 기준이므로 월요일 기준으로 보정
 */
function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  // 일요일(0)은 -6, 월요일(1)은 0, 화요일(2)은 -1 ... 로 보정
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * 선택 날짜가 현재 주간 뷰 범위(월~일)를 벗어나면
 * weekBaseDate를 선택 날짜로 동기화
 */
function syncWeekToSelectedDate() {
  const weekDays = getWeekDays(weekBaseDate);
  const keys     = weekDays.map(formatDateKey);
  if (!keys.includes(formatDateKey(selectedDate))) {
    weekBaseDate = new Date(selectedDate);
  }
}

/**
 * 기준 날짜가 속한 주의 월~일 Date 배열(7개) 반환
 */
function getWeekDays(base) {
  const monday = getWeekMonday(base);
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}

/**
 * 선택된 날짜가 오늘인지 확인
 */
function isToday(date) {
  return formatDateKey(date) === formatDateKey(getTodayDate());
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
    date:   formatDateKey(selectedDate),
  };
  todoItems.push(newTodo);

  todoInput.value = '';
  clearErrorState();
  saveToStorage();

  if (currentFilter === 'done') {
    handleFilterChange('all');
  } else {
    // 주간 뷰 카운트도 갱신
    renderWeekNav();
    renderAll();
  }
}

/**
 * Todo 완료 토글
 */
function toggleDone(id) {
  const todo = findTodoById(id);
  if (!todo) return;
  todo.isDone = !todo.isDone;
  saveToStorage();
  renderWeekNav(); // 완료 시 카운트 갱신
  renderAll();
}

/**
 * 수정 모드 활성화 — 텍스트 + 날짜 input 표시
 */
function activateEditMode(id) {
  const listItem = document.querySelector(`[data-id="${id}"]`);
  if (!listItem) return;

  const todo    = findTodoById(id);
  const textEl  = listItem.querySelector('.todo-text');
  const editBtn = listItem.querySelector('.btn-edit');

  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'edit-input';
  editInput.value     = todo.text;
  editInput.maxLength = 100;

  const dateInput = document.createElement('input');
  dateInput.type      = 'date';
  dateInput.className = 'edit-date-input';
  dateInput.value     = todo.date;

  const editWrapper = document.createElement('div');
  editWrapper.className = 'edit-wrapper';
  editWrapper.append(editInput, dateInput);

  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn-save';
  saveBtn.textContent = '저장';
  saveBtn.addEventListener('click', () => handleSaveEdit(id, editInput, dateInput));

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  handleSaveEdit(id, editInput, dateInput);
    if (e.key === 'Escape') renderAll();
  });

  textEl.replaceWith(editWrapper);
  editBtn.replaceWith(saveBtn);

  editInput.focus();
  editInput.select();
}

/**
 * 수정 저장 — 텍스트 + 날짜 반영
 */
function handleSaveEdit(id, editInput, dateInput) {
  const newText = editInput.value.trim();
  if (!newText) { editInput.focus(); return; }

  const todo = findTodoById(id);
  if (!todo) return;

  todo.text = newText;
  if (dateInput.value) todo.date = dateInput.value;

  saveToStorage();
  renderWeekNav(); // 날짜 변경 시 카운트 갱신
  renderAll();
}

/**
 * 필터 탭 변경
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
 * 날짜 이동 시 필터 '전체'로 초기화
 */
function resetFilterToAll() {
  handleFilterChange('all');
}

/**
 * 현재 선택 날짜 + 필터로 표시할 todo 반환
 */
function getFilteredItems() {
  const dateKey = formatDateKey(selectedDate);
  const byDate  = todoItems.filter((t) => t.date === dateKey);

  switch (currentFilter) {
    case 'active': return byDate.filter((t) => !t.isDone);
    case 'done':   return byDate.filter((t) =>  t.isDone);
    default: {
      const active = byDate.filter((t) => !t.isDone);
      const done   = byDate.filter((t) =>  t.isDone);
      return [...active, ...done];
    }
  }
}

/**
 * 삭제 모달 열기
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
  saveToStorage();
  closeDeleteModal();
  renderWeekNav();
  renderAll();
}

// ─── 렌더링 ──────────────────────────────────

/**
 * 주간 뷰 렌더링
 * - 헤더에 "6월 2일 ~ 6월 8일" 형식의 주 범위 표시
 * - 7개 요일 셀 생성: 요일명 / 날짜 / todo 개수 / 오늘·선택 스타일
 */
function renderWeekNav() {
  const weekDays = getWeekDays(weekBaseDate);
  const monday   = weekDays[0];
  const sunday   = weekDays[6];

  // 주 범위 레이블 (월이 같으면 "6월 2일 ~ 8일", 다르면 "5월 26일 ~ 6월 1일")
  if (monday.getMonth() === sunday.getMonth()) {
    weekRangeLabel.textContent =
      `${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${sunday.getDate()}일`;
  } else {
    weekRangeLabel.textContent =
      `${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${sunday.getMonth() + 1}월 ${sunday.getDate()}일`;
  }

  const dayNames    = ['월', '화', '수', '목', '금', '토', '일'];
  const todayKey    = formatDateKey(getTodayDate());
  const selectedKey = formatDateKey(selectedDate);

  weekDaysEl.innerHTML = '';

  weekDays.forEach((day, i) => {
    const dateKey    = formatDateKey(day);
    const dayTodos   = todoItems.filter((t) => t.date === dateKey);
    const totalCount = dayTodos.length;
    // 미완료 개수만 표시 (완료 제외)
    const activeCount = dayTodos.filter((t) => !t.isDone).length;
    // 할 일이 하나 이상 있고 전부 완료된 경우
    const allDone     = totalCount > 0 && activeCount === 0;

    const li = document.createElement('li');
    li.className = 'week-day-cell';
    if (dateKey === todayKey)    li.classList.add('is-today');
    if (dateKey === selectedKey) li.classList.add('is-selected');

    // 날짜 셀 클릭 → 해당 날짜 선택
    li.addEventListener('click', () => handleWeekDayClick(day));

    const nameEl = document.createElement('span');
    nameEl.className   = 'week-day-name';
    nameEl.textContent = dayNames[i];

    const dateEl = document.createElement('span');
    dateEl.className   = 'week-day-date';
    dateEl.textContent = day.getDate();

    const countEl = document.createElement('span');

    if (allDone) {
      // 전부 완료 → 체크 아이콘 표시
      countEl.className   = 'week-day-count is-all-done';
      countEl.textContent = '✓';
    } else if (activeCount > 0) {
      // 미완료 항목이 있으면 미완료 개수만 표시
      countEl.className   = 'week-day-count has-todos';
      countEl.textContent = activeCount;
    } else {
      // 할 일 없음 → 빈칸
      countEl.className   = 'week-day-count';
      countEl.textContent = '';
    }

    li.append(nameEl, dateEl, countEl);
    weekDaysEl.appendChild(li);
  });
}

/**
 * 주간 뷰에서 날짜 셀 클릭 처리
 * 선택 날짜를 클릭한 날로 변경하고 일간 네비게이터도 동기화
 */
function handleWeekDayClick(date) {
  selectedDate = new Date(date);
  renderWeekNav();   // 선택 스타일 갱신
  renderDateNav();   // 일간 네비게이터 텍스트 갱신
  resetFilterToAll();
}

/**
 * 일간 날짜 네비게이터 갱신
 */
function renderDateNav() {
  dateLabel.textContent = formatDateDisplay(selectedDate);

  if (isToday(selectedDate)) {
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
 * 빈 상태 표시/숨김
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

// ─── 로컬스토리지 ────────────────────────────

/**
 * todoItems, nextId를 로컬스토리지에 저장
 */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY_ITEMS,  JSON.stringify(todoItems));
  localStorage.setItem(STORAGE_KEY_NEXTID, String(nextId));
}

/**
 * 로컬스토리지에서 데이터 복원
 */
function loadFromStorage() {
  try {
    const savedItems  = localStorage.getItem(STORAGE_KEY_ITEMS);
    const savedNextId = localStorage.getItem(STORAGE_KEY_NEXTID);
    if (savedItems)  todoItems = JSON.parse(savedItems);
    if (savedNextId) nextId    = Number(savedNextId);
  } catch (e) {
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