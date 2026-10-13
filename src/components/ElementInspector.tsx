import React from 'react';
import { InteractiveElement, ElementType } from '../types';
import { Trash2, Copy, Plus, X, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ElementInspectorProps {
  element: InteractiveElement | null;
  onUpdate: (updated: InteractiveElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: InteractiveElement) => void;
  allElements: InteractiveElement[];
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  allElements,
}) => {
  if (!element) {
    return (
      <div className="p-5 text-center text-slate-500 bg-white border border-slate-200/80 rounded-md shadow-xs">
        <HelpCircle size={28} className="mx-auto mb-2 text-[#392a79]/40" />
        <h4 className="font-semibold text-slate-700 text-sm mb-1">Ninguna celda seleccionada</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Haz clic en cualquier celda o punto de la hoja para personalizar su respuesta correcta, tamaño, opciones o posición.
        </p>
      </div>
    );
  }

  const handleTypeChange = (newType: ElementType) => {
    let extraProps: Partial<InteractiveElement> = {};
    if (newType === 'select_dropdown' && (!element.options || element.options.length === 0)) {
      extraProps.options = ['Opción A', 'Opción B', 'Opción C'];
      extraProps.correctAnswer = 'Opción A';
    } else if (newType === 'connect_dot') {
      extraProps.width = 4.5;
      extraProps.height = 3.5;
      extraProps.pairId = element.pairId || `pair-${Date.now().toString().slice(-4)}`;
    } else if (newType === 'hotspot_choice') {
      extraProps.choiceMode = element.choiceMode || 'checkbox';
      extraProps.correctAnswer = element.correctAnswer || 'true';
      if (!element.width || element.width < 5) extraProps.width = 6;
      if (!element.height || element.height < 4) extraProps.height = 5;
    }
    onUpdate({
      ...element,
      type: newType,
      ...extraProps,
    });
  };

  const handleAddOption = () => {
    const current = element.options || [];
    const nextName = `Opción ${current.length + 1}`;
    onUpdate({
      ...element,
      options: [...current, nextName],
    });
  };

  const handleRemoveOption = (index: number) => {
    const current = element.options || [];
    const filtered = current.filter((_, i) => i !== index);
    onUpdate({
      ...element,
      options: filtered,
      correctAnswer: element.correctAnswer === current[index] ? filtered[0] || '' : element.correctAnswer,
    });
  };

  const handleUpdateOption = (index: number, val: string) => {
    const current = [...(element.options || [])];
    const oldVal = current[index];
    current[index] = val;
    onUpdate({
      ...element,
      options: current,
      correctAnswer: element.correctAnswer === oldVal ? val : element.correctAnswer,
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-md shadow-sm p-4 text-slate-700 space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#392a79]">
            Propiedades de Celda
          </span>
          <h3 className="font-bold text-slate-900 text-sm capitalize">
            {element.type === 'text_input'
              ? 'Celda de Autollenado'
              : element.type === 'select_dropdown'
              ? 'Lista de Selección'
              : element.type === 'connect_dot'
              ? 'Punto para Unir'
              : 'Casilla de Selección'}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(element)}
            title="Duplicar celda"
            className="p-1.5 text-slate-500 hover:text-[#392a79] hover:bg-slate-100 rounded-sm transition-colors"
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            title="Eliminar celda"
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tipo de Celda */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Celda</label>
        <select
          value={element.type}
          onChange={e => handleTypeChange(e.target.value as ElementType)}
          className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-[#392a79] outline-none"
        >
          <option value="text_input">✍️ Autollenado (Texto / Número)</option>
          <option value="select_dropdown">📋 Lista de Selección (Menú)</option>
          <option value="connect_dot">🔗 Punto para Unir con Línea</option>
          <option value="hotspot_choice">☑️ Casilla / Clic para Marcar</option>
        </select>
      </div>

      {/* Properties based on type */}
      {element.type === 'text_input' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Respuesta Correcta
            </label>
            <input
              type="text"
              value={element.correctAnswer}
              placeholder="Ej: Flor (usa | para sinónimos: Flor|La Flor)"
              onChange={e => onUpdate({ ...element, correctAnswer: e.target.value })}
              className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-[#392a79] outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              💡 Puedes escribir varias respuestas válidas separadas por barra vertical <code className="bg-slate-100 px-1 py-0.5 rounded-xs">|</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Texto Marcador de Posición (Placeholder)
            </label>
            <input
              type="text"
              value={element.placeholder || ''}
              placeholder="Ej: Escribe aquí..."
              onChange={e => onUpdate({ ...element, placeholder: e.target.value })}
              className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-[#392a79] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ignoreAccents"
              checked={element.ignoreAccents !== false}
              onChange={e => onUpdate({ ...element, ignoreAccents: e.target.checked })}
              className="rounded text-[#392a79] focus:ring-[#392a79]"
            />
            <label htmlFor="ignoreAccents" className="text-xs text-slate-600 cursor-pointer">
              Ignorar tildes y mayúsculas (Recomendado para primaria)
            </label>
          </div>
        </div>
      )}

      {element.type === 'select_dropdown' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600">Opciones del Menú</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[11px] font-bold text-[#52b68e] hover:text-emerald-700 flex items-center gap-0.5"
              >
                <Plus size={13} /> Añadir opción
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(element.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="correct-opt"
                    title="Marcar como respuesta correcta"
                    checked={element.correctAnswer === opt}
                    onChange={() => onUpdate({ ...element, correctAnswer: opt })}
                    className="text-[#52b68e] focus:ring-[#52b68e] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={e => handleUpdateOption(idx, e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:border-[#392a79] outline-none"
                  />
                  {(element.options || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[#52b68e]" />
              El botón circular marca la respuesta correcta.
            </p>
          </div>
        </div>
      )}

      {element.type === 'hotspot_choice' && (
        <div className="space-y-3">
          {/* Subtype selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Modo de Casilla
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...element,
                    choiceMode: 'checkbox',
                    correctAnswer: element.correctAnswer === 'F' ? 'false' : 'true',
                  })
                }
                className={`py-1 px-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  (element.choiceMode || 'checkbox') === 'checkbox'
                    ? 'bg-white text-[#392a79] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ☑️ Casilla (✓)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...element,
                    choiceMode: 'true_false',
                    correctAnswer: element.correctAnswer === 'false' ? 'F' : 'V',
                    width: Math.max(element.width, 9),
                    height: Math.max(element.height, 5),
                  })
                }
                className={`py-1 px-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  element.choiceMode === 'true_false'
                    ? 'bg-white text-[#392a79] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔤 V / F
              </button>
            </div>
          </div>

          {/* If Mode is Checkbox: Allow setting True (must be checked) or Erroneous (must be unchecked) */}
          {(element.choiceMode || 'checkbox') === 'checkbox' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Respuesta Correcta Esperada
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...element, correctAnswer: 'true' })}
                  className={`w-full text-left p-2 rounded-md border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    element.correctAnswer !== 'false'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                    <span>Verdadera (Debe estar marcada)</span>
                  </span>
                  {element.correctAnswer !== 'false' && (
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Correcta
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onUpdate({ ...element, correctAnswer: 'false' })}
                  className={`w-full text-left p-2 rounded-md border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    element.correctAnswer === 'false'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold ring-1 ring-amber-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm border border-slate-400 bg-white text-slate-400 flex items-center justify-center text-[10px]">
                      ☐
                    </span>
                    <span>Errónea (Debe dejarse vacía)</span>
                  </span>
                  {element.correctAnswer === 'false' && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                      Distractor
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                💡 Si es errónea, el alumno obtiene el punto si la deja sin marcar (en actividades como "marca solo las respuestas correctas").
              </p>
            </div>
          )}

          {/* If Mode is True / False (V / F) */}
          {element.choiceMode === 'true_false' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Respuesta Correcta: Verdadero (V) o Falso (F)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...element, correctAnswer: 'V' })}
                  className={`p-2.5 rounded-md border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    (element.correctAnswer || 'V').toUpperCase() === 'V'
                      ? 'bg-[#52b68e]/20 border-[#52b68e] text-[#0d3824] ring-2 ring-[#52b68e]/40 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base font-black text-[#15803d]">V</span>
                  <span>Verdadero</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdate({ ...element, correctAnswer: 'F' })}
                  className={`p-2.5 rounded-md border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    (element.correctAnswer || 'V').toUpperCase() === 'F'
                      ? 'bg-[#eb6281]/20 border-[#eb6281] text-[#a82245] ring-2 ring-[#eb6281]/40 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base font-black text-[#eb6281]">F</span>
                  <span>Falso</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                💡 El alumno verá los botones interactivos [V] y [F] en la celda para marcar su opción.
              </p>
            </div>
          )}
        </div>
      )}

      {element.type === 'connect_dot' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Identificador de Pareja (ID de Unión)
            </label>
            <input
              type="text"
              value={element.pairId || ''}
              placeholder="Ej: pareja-1"
              onChange={e => onUpdate({ ...element, pairId: e.target.value })}
              className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-[#392a79] outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              💡 Dos puntos que comparten el mismo ID de pareja deben ser unidos por el estudiante.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Etiqueta de Referencia
            </label>
            <input
              type="text"
              value={element.dotLabel || ''}
              placeholder="Ej: A, 4+2, Flor..."
              onChange={e => onUpdate({ ...element, dotLabel: e.target.value })}
              className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-[#392a79] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Color del Punto de Conexión
            </label>
            <div className="flex items-center gap-2">
              {[
                { name: 'Rosa Coral', hex: '#eb6281' },
                { name: 'Amarillo Sol', hex: '#ffcf23' },
                { name: 'Verde Menta', hex: '#52b68e' },
                { name: 'Púrpura Índigo', hex: '#392a79' },
              ].map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => onUpdate({ ...element, dotColor: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    (element.dotColor || (element.dotRole === 'start' ? '#eb6281' : '#52b68e')) === c.hex
                      ? 'border-slate-800 scale-110 shadow-xs'
                      : 'border-white hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Puntos de evaluación */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">Puntos por Acierto</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="10"
            value={element.points || 1}
            onChange={e => onUpdate({ ...element, points: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-16 text-xs text-center font-bold border border-slate-300 rounded-md py-1 focus:border-[#392a79] outline-none"
          />
          <span className="text-xs text-slate-500 font-medium">pts</span>
        </div>
      </div>

      {/* Guía rápida de coordenadas */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div>Pos X: {element.x.toFixed(1)}%</div>
        <div>Pos Y: {element.y.toFixed(1)}%</div>
      </div>
    </div>
  );
};
