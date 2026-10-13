import React, { useRef, useState, useEffect } from 'react';
import { InteractiveElement, LineConnection } from '../types';
import { Check, X, Move, ChevronDown, Link2, Sparkles } from 'lucide-react';

interface WorksheetCanvasProps {
  mode: 'editor' | 'student';
  imageUrl: string;
  elements: InteractiveElement[];
  selectedElementId: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (updated: InteractiveElement) => void;
  studentAnswers?: Record<string, string>;
  onStudentAnswerChange?: (id: string, value: string) => void;
  studentConnections?: LineConnection[];
  onAddConnection?: (fromId: string, toId: string) => void;
  onRemoveConnection?: (connectionId: string) => void;
  isEvaluated?: boolean;
  elementResults?: Record<string, boolean>;
  connectionResults?: Record<string, boolean>;
  showAnswers?: boolean;
  zoomLevel?: number; // 0.8, 1, 1.2
}

export const WorksheetCanvas: React.FC<WorksheetCanvasProps> = ({
  mode,
  imageUrl,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  studentAnswers = {},
  onStudentAnswerChange,
  studentConnections = [],
  onAddConnection,
  onRemoveConnection,
  isEvaluated = false,
  elementResults = {},
  connectionResults = {},
  showAnswers = false,
  zoomLevel = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging & Resizing state (Editor Mode)
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; elemX: number; elemY: number; width: number; height: number } | null>(null);

  // Drawing Connection state (Student Mode or Editor Mode)
  const [activeDrawingDotId, setActiveDrawingDotId] = useState<string | null>(null);
  const [mousePosPercent, setMousePosPercent] = useState<{ x: number; y: number } | null>(null);

  // Helper to convert mouse client coordinates to container percentages
  const getContainerPercentage = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Editor Drag & Resize handlers
  const handlePointerDownElement = (e: React.PointerEvent, elem: InteractiveElement, isResize = false) => {
    if (mode !== 'editor') return;
    e.stopPropagation();
    e.preventDefault();

    onSelectElement?.(elem.id);

    if (isResize) {
      setResizingId(elem.id);
    } else {
      setDraggingId(elem.id);
    }

    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
      width: elem.width,
      height: elem.height,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Editor Dragging
    if (draggingId && dragStartPos && onUpdateElement) {
      const deltaXPercent = ((e.clientX - dragStartPos.mouseX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartPos.mouseY) / rect.height) * 100;

      const currentElem = elements.find(el => el.id === draggingId);
      if (currentElem) {
        const newX = Math.max(0, Math.min(100 - currentElem.width, Number((dragStartPos.elemX + deltaXPercent).toFixed(1))));
        const newY = Math.max(0, Math.min(100 - currentElem.height, Number((dragStartPos.elemY + deltaYPercent).toFixed(1))));

        onUpdateElement({
          ...currentElem,
          x: newX,
          y: newY,
        });
      }
    }

    // Editor Resizing
    if (resizingId && dragStartPos && onUpdateElement) {
      const deltaXPercent = ((e.clientX - dragStartPos.mouseX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartPos.mouseY) / rect.height) * 100;

      const currentElem = elements.find(el => el.id === resizingId);
      if (currentElem) {
        const newW = Math.max(3, Math.min(100 - currentElem.x, Number((dragStartPos.width + deltaXPercent).toFixed(1))));
        const newH = Math.max(2, Math.min(100 - currentElem.y, Number((dragStartPos.height + deltaYPercent).toFixed(1))));

        onUpdateElement({
          ...currentElem,
          width: newW,
          height: newH,
        });
      }
    }

    // Live Student Line Drawing tracking
    if (activeDrawingDotId) {
      const coords = getContainerPercentage(e.clientX, e.clientY);
      setMousePosPercent(coords);
    }
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setResizingId(null);
    setDragStartPos(null);
  };

  // Dot connection handler (Student mode & testing)
  const handleDotClick = (dotElem: InteractiveElement, e: React.MouseEvent) => {
    e.stopPropagation();

    if (mode === 'editor') {
      onSelectElement?.(dotElem.id);
      return;
    }

    if (!activeDrawingDotId) {
      // Start drawing line from this dot
      setActiveDrawingDotId(dotElem.id);
      const coords = getContainerPercentage(e.clientX, e.clientY);
      setMousePosPercent(coords);
    } else {
      // Complete connection to target dot
      if (activeDrawingDotId !== dotElem.id) {
        onAddConnection?.(activeDrawingDotId, dotElem.id);
      }
      setActiveDrawingDotId(null);
      setMousePosPercent(null);
    }
  };

  // Cancel drawing if clicked background
  const handleBackgroundClick = () => {
    if (activeDrawingDotId) {
      setActiveDrawingDotId(null);
      setMousePosPercent(null);
    } else if (mode === 'editor') {
      onSelectElement?.(null);
    }
  };

  const activeDotElement = elements.find(el => el.id === activeDrawingDotId);

  return (
    <div className="w-full max-w-full overflow-auto max-h-[82vh] p-2 sm:p-4 bg-slate-100/80 rounded-md border border-slate-200/90 relative flex justify-start sm:justify-center items-start">
      <div
        style={{
          width: `${Math.round(860 * zoomLevel)}px`,
          minWidth: `${Math.round(860 * zoomLevel)}px`,
          transition: 'width 0.15s ease-out',
        }}
        className="shrink-0 my-0 mx-auto"
      >
        <div
          ref={containerRef}
          onClick={handleBackgroundClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative bg-white shadow-xl rounded-md border border-slate-200/80 overflow-hidden select-none w-full"
          style={{
            touchAction: activeDrawingDotId || draggingId || resizingId ? 'none' : 'auto',
          }}
        >
        {/* Base Worksheet Image */}
        <img
          src={imageUrl}
          alt="Hoja de trabajo"
          className="w-full h-auto block pointer-events-none"
          draggable={false}
        />

        {/* SVG Layer for Drawing & Rendered Connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Editor Mode: Preview teacher target connections in subtle dashed line */}
          {mode === 'editor' &&
            elements
              .filter(el => el.type === 'connect_dot' && el.pairId)
              .map((dot, idx, arr) => {
                const partner = arr.find(other => other.id !== dot.id && other.pairId === dot.pairId);
                if (!partner || dot.id > partner.id) return null; // Avoid duplicate lines
                const x1 = dot.x + dot.width / 2;
                const y1 = dot.y + dot.height / 2;
                const x2 = partner.x + partner.width / 2;
                const y2 = partner.y + partner.height / 2;
                return (
                  <line
                    key={`editor-pair-${dot.id}-${partner.id}`}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke="#52b68e"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    opacity={0.6}
                  />
                );
              })}

          {/* Student Mode / Rendered Connections */}
          {studentConnections.map(conn => {
            const from = elements.find(e => e.id === conn.fromId);
            const to = elements.find(e => e.id === conn.toId);
            if (!from || !to) return null;

            const x1 = from.x + from.width / 2;
            const y1 = from.y + from.height / 2;
            const x2 = to.x + to.width / 2;
            const y2 = to.y + to.height / 2;

            let strokeColor = '#392a79';
            let strokeWidth = '3.5';

            if (isEvaluated) {
              const isCorrect = connectionResults[conn.id];
              strokeColor = isCorrect ? '#10b981' : '#ef4444';
              strokeWidth = '4';
            }

            return (
              <g key={conn.id} className="cursor-pointer pointer-events-auto">
                {/* Thick invisible click area to allow removing connection */}
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="transparent"
                  strokeWidth="16"
                  onClick={e => {
                    e.stopPropagation();
                    if (!isEvaluated) onRemoveConnection?.(conn.id);
                  }}
                />
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
              </g>
            );
          })}

          {/* Active drawing line following user pointer */}
          {activeDotElement && mousePosPercent && (
            <line
              x1={`${activeDotElement.x + activeDotElement.width / 2}%`}
              y1={`${activeDotElement.y + activeDotElement.height / 2}%`}
              x2={`${mousePosPercent.x}%`}
              y2={`${mousePosPercent.y}%`}
              stroke={activeDotElement.dotColor || "#eb6281"}
              strokeWidth="4"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Interactive Elements Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-auto">
          {elements.map(elem => {
            const isSelected = selectedElementId === elem.id;
            const isDotActive = activeDrawingDotId === elem.id;
            const isCorrect = isEvaluated && elementResults[elem.id];
            const isWrong = isEvaluated && elementResults[elem.id] === false;

            // 1. Point-to-Point Connect Dot
            if (elem.type === 'connect_dot') {
              const cx = elem.x + elem.width / 2;
              const cy = elem.y + elem.height / 2;
              const baseColor = elem.dotColor || (elem.dotRole === 'start' ? '#eb6281' : '#52b68e');

              return (
                <div
                  key={elem.id}
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                >
                  <button
                    type="button"
                    onClick={e => handleDotClick(elem, e)}
                    onPointerDown={e => {
                      if (mode === 'editor') handlePointerDownElement(e, elem);
                    }}
                    title={mode === 'editor' ? 'Arrastrar para mover punto' : 'Haz clic para unir con otro punto'}
                    style={{
                      backgroundColor: isDotActive ? '#ffcf23' : baseColor,
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 relative ${
                      isDotActive
                        ? 'ring-4 ring-[#ffcf23]/50 scale-125'
                        : isSelected && mode === 'editor'
                        ? 'ring-4 ring-[#392a79]/40 scale-110'
                        : 'hover:scale-120'
                    } border-2 border-white shadow-md cursor-pointer`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white block" />
                  </button>

                  {/* Editor label / indicator */}
                  {mode === 'editor' && (
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-700 bg-white/95 px-1.5 rounded-sm shadow-xs border border-slate-200">
                      {elem.dotLabel || elem.pairId || 'Punto'}
                    </div>
                  )}
                </div>
              );
            }

            // 2. Text Input & Select Dropdown & Hotspot
            return (
              <div
                key={elem.id}
                style={{
                  left: `${elem.x}%`,
                  top: `${elem.y}%`,
                  width: `${elem.width}%`,
                  height: `${elem.height}%`,
                }}
                onPointerDown={e => {
                  if (mode === 'editor') handlePointerDownElement(e, elem);
                }}
                className={`absolute transition-shadow duration-150 ${
                  mode === 'editor'
                    ? `cursor-move ${
                        isSelected
                          ? 'ring-2 ring-[#392a79] ring-offset-1 bg-[#392a79]/10 rounded'
                          : 'hover:ring-1 hover:ring-[#392a79]/50 bg-white/70 hover:bg-white/90 rounded'
                      }`
                    : ''
                }`}
              >
                {/* Visual Status Indicator in Student Mode (Evaluated) */}
                {isEvaluated && (
                  <div
                    className={`absolute -top-3 -right-3 z-30 w-5 h-5 rounded-full flex items-center justify-center shadow text-white text-[11px] font-bold ${
                      isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  >
                    {isCorrect ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                  </div>
                )}

                {/* Show correct answer badge if student made a mistake */}
                {isWrong && (showAnswers || isEvaluated) && (
                  <div className="absolute -bottom-6 left-0 z-30 whitespace-nowrap bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                    Resp:{' '}
                    {elem.choiceMode === 'true_false'
                      ? (elem.correctAnswer || 'V').toUpperCase()
                      : elem.type === 'hotspot_choice'
                      ? elem.correctAnswer === 'false'
                        ? 'Dejar vacía'
                        : 'Marcar ✓'
                      : elem.correctAnswer.split('|')[0]}
                  </div>
                )}

                {/* Content based on element type */}
                {elem.type === 'text_input' ? (
                  <input
                    type="text"
                    disabled={mode === 'editor' || isEvaluated}
                    value={mode === 'student' ? studentAnswers[elem.id] || '' : ''}
                    placeholder={elem.placeholder || (mode === 'editor' ? 'Texto...' : '')}
                    onChange={e => onStudentAnswerChange?.(elem.id, e.target.value)}
                    style={{ fontSize: elem.fontSize ? `${elem.fontSize}px` : '15px' }}
                    className={`w-full h-full text-center font-semibold rounded outline-none px-2 transition-colors duration-150 ${
                      mode === 'editor'
                        ? 'border border-dashed border-[#392a79] bg-transparent text-[#392a79] placeholder-[#392a79]/50'
                        : isCorrect
                        ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800'
                        : isWrong
                        ? 'border-2 border-red-500 bg-red-50 text-red-800'
                        : 'border-2 border-[#392a79]/70 focus:border-[#52b68e] focus:bg-white bg-white/95 text-[#392a79] shadow-xs'
                    }`}
                  />
                ) : elem.type === 'select_dropdown' ? (
                  <div className="relative w-full h-full">
                    <select
                      disabled={mode === 'editor' || isEvaluated}
                      value={mode === 'student' ? studentAnswers[elem.id] || '' : ''}
                      onChange={e => onStudentAnswerChange?.(elem.id, e.target.value)}
                      style={{ fontSize: elem.fontSize ? `${elem.fontSize}px` : '14px' }}
                      className={`w-full h-full appearance-none pr-6 pl-2 text-center font-semibold rounded outline-none transition-colors duration-150 ${
                        mode === 'editor'
                          ? 'border border-dashed border-[#392a79] bg-white/60 text-[#392a79]'
                          : isCorrect
                          ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800'
                          : isWrong
                          ? 'border-2 border-red-500 bg-red-50 text-red-800'
                          : 'border-2 border-[#392a79]/70 focus:border-[#52b68e] bg-white/95 text-[#392a79] shadow-xs cursor-pointer'
                      }`}
                    >
                      <option value="">{elem.placeholder || '-- Elegir --'}</option>
                      {(elem.options || ['Opción 1', 'Opción 2']).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                  </div>
                ) : elem.choiceMode === 'true_false' ? (
                  // Verdadero (V) o Falso (F) dual button choice
                  <div className="w-full h-full flex items-center justify-center gap-1 p-0.5 bg-white/95 rounded border border-[#392a79]/40 shadow-xs">
                    {/* Botón Verdadero (V) */}
                    <button
                      type="button"
                      disabled={mode === 'editor' || isEvaluated}
                      onClick={() => onStudentAnswerChange?.(elem.id, 'V')}
                      title="Verdadero (V)"
                      className={`flex-1 h-full rounded text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        mode === 'editor'
                          ? (elem.correctAnswer || 'V').toUpperCase() === 'V'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : studentAnswers[elem.id]?.toUpperCase() === 'V'
                          ? isEvaluated
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      V
                    </button>

                    {/* Botón Falso (F) */}
                    <button
                      type="button"
                      disabled={mode === 'editor' || isEvaluated}
                      onClick={() => onStudentAnswerChange?.(elem.id, 'F')}
                      title="Falso (F)"
                      className={`flex-1 h-full rounded text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        mode === 'editor'
                          ? (elem.correctAnswer || 'V').toUpperCase() === 'F'
                            ? 'bg-[#eb6281] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : studentAnswers[elem.id]?.toUpperCase() === 'F'
                          ? isEvaluated
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-[#eb6281] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                      }`}
                    >
                      F
                    </button>
                  </div>
                ) : (
                  // Casilla de Verificación (Checkbox)
                  <button
                    type="button"
                    disabled={mode === 'editor' || isEvaluated}
                    onClick={() => {
                      const cur = studentAnswers[elem.id] === 'true' ? 'false' : 'true';
                      onStudentAnswerChange?.(elem.id, cur);
                    }}
                    title={
                      mode === 'editor'
                        ? elem.correctAnswer === 'false'
                          ? 'Casilla Errónea (Distractor: el alumno debe dejarla vacía)'
                          : 'Casilla Verdadera (El alumno debe marcarla)'
                        : 'Haz clic para marcar o desmarcar'
                    }
                    className={`w-full h-full rounded border-2 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      mode === 'editor'
                        ? elem.correctAnswer === 'false'
                          ? 'border-amber-400 bg-amber-50/90 text-amber-700'
                          : 'border-emerald-500 bg-emerald-50/90 text-emerald-700'
                        : isEvaluated
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : studentAnswers[elem.id] === 'true'
                        ? 'border-[#52b68e] bg-[#52b68e]/20 text-[#392a79]'
                        : 'border-[#392a79]/40 bg-white/90 text-slate-500 hover:border-[#52b68e]'
                    }`}
                  >
                    {mode === 'editor' ? (
                      elem.correctAnswer === 'false' ? (
                        <span className="text-[10px] font-black text-amber-600">✗ F</span>
                      ) : (
                        <Check size={16} strokeWidth={3} className="text-emerald-600" />
                      )
                    ) : studentAnswers[elem.id] === 'true' ? (
                      <Check size={16} strokeWidth={3} className="text-[#52b68e]" />
                    ) : null}
                  </button>
                )}

                {/* Editor Resize Handle */}
                {mode === 'editor' && isSelected && (
                  <>
                    <div
                      onPointerDown={e => handlePointerDownElement(e, elem, true)}
                      title="Arrastra para redimensionar celda"
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#392a79] border-2 border-white rounded-xs shadow cursor-se-resize z-40"
                    />
                    <div className="absolute -top-4 left-0 flex items-center gap-1 text-[10px] font-bold text-[#392a79] bg-white px-1 rounded shadow-xs border border-slate-200">
                      {elem.type === 'text_input'
                        ? 'Texto'
                        : elem.type === 'select_dropdown'
                        ? 'Lista'
                        : elem.choiceMode === 'true_false'
                        ? 'V / F'
                        : 'Casilla'}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
  );
};
