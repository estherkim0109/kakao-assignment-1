/* =============================================
   TodoInput.jsx — todo 텍스트 입력 + 추가 버튼
   ============================================= */
import { useState, useRef } from 'react';

/**
 * props:
 *   onAdd(text) — 유효한 텍스트 입력 시 호출
 */
function TodoInput({ onAdd }) {
  const [inputValue, setInputValue]   = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 한글 등 IME 조합 중 여부를 추적
  // — 조합 완료 시 발생하는 'Enter' 이벤트가 handleAdd를 이중 호출하는 것을 방지
  const isComposingRef = useRef(false);

  function handleAdd() {
    const text = inputValue.trim();
    if (!text) {
      setErrorMessage('할 일을 입력해주세요.');
      return;
    }
    onAdd(text);
    setInputValue('');
    setErrorMessage('');
  }

  function handleKeyDown(e) {
    // IME 조합 중 Enter는 무시 (한글 입력 완료 이벤트와 구분)
    if (isComposingRef.current) return;
    if (e.key === 'Enter') handleAdd();
  }

  function handleChange(e) {
    setInputValue(e.target.value);
    // 타이핑 시작하면 에러 메시지 즉시 제거
    if (errorMessage) setErrorMessage('');
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => { isComposingRef.current = false; }}
          placeholder="할 일을 입력하세요"
          maxLength={100}
          className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${
            errorMessage ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          추가
        </button>
      </div>

      {/* 빈 입력 시 안내 메시지 */}
      {errorMessage && (
        <p className="text-red-500 text-xs mt-1 pl-1">{errorMessage}</p>
      )}
    </div>
  );
}

export default TodoInput;
