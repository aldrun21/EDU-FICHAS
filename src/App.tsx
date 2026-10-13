import React, { useState, useRef, useEffect } from 'react';
import { WorksheetData, InteractiveElement, LineConnection, EvaluationResult } from './types';
import { SAMPLE_WORKSHEETS } from './data/samples';
import { checkAnswer, checkConnection } from './utils/helpers';
import { WorksheetCanvas } from './components/WorksheetCanvas';
import { ElementInspector } from './components/ElementInspector';
import { StudentScoreBanner } from './components/StudentScoreBanner';
import { CloudflareExportModal } from './components/CloudflareExportModal';
import { BrandLogo } from './components/BrandLogo';
import {
  Upload,
  Plus,
  Play,
  Edit3,
  CheckCircle2,
  Trash2,
  Download,
  Share2,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  Sparkles,
  Link as LinkIcon,
  List,
  Type,
  FolderOpen,
  Cloud,
  CheckSquare
} from 'lucide-react';

export default function App() {
  // Current active worksheet
  const [worksheet, setWorksheet] = useState<WorksheetData>(() => {
    const saved = localStorage.getItem('edufichas_current_sheet');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return SAMPLE_WORKSHEETS[0];
  });

  // Mode: 'editor' (teacher designing & placing cells) | 'student' (solving worksheet)
  const [mode, setMode] = useState<'editor' | 'student'>('editor');

  // Selected element in editor
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Student mode state
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [studentConnections, setStudentConnections] = useState<LineConnection[]>([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  // UI state
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [showSampleSelector, setShowSampleSelector] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save current worksheet to local storage
  useEffect(() => {
    try {
      localStorage.setItem('edufichas_current_sheet', JSON.stringify(worksheet));
    } catch (e) {
      // ignore
    }
  }, [worksheet]);

  // Handle uploading custom PNG/JPG
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setWorksheet(prev => ({
          ...prev,
          id: `custom-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          imageUrl: result,
          elements: [], // start fresh with clean worksheet
        }));
        setSelectedElementId(null);
        resetStudentState();
      }
    };
    reader.readAsDataURL(file);
    // clear input
    e.target.value = '';
  };

  const resetStudentState = () => {
    setStudentAnswers({});
    setStudentConnections([]);
    setIsEvaluated(false);
    setEvaluation(null);
    setShowAnswers(false);
  };

  // Add new Interactive Elements
  const handleAddTextInput = () => {
    const newElem: InteractiveElement = {
      id: `text-${Date.now()}`,
      type: 'text_input',
      x: 35,
      y: 35,
      width: 20,
      height: 6,
      correctAnswer: '',
      placeholder: 'Escribe aquí...',
      points: 1,
      fontSize: 15,
      ignoreAccents: true,
      caseSensitive: false,
    };
    setWorksheet(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedElementId(newElem.id);
  };

  const handleAddSelectDropdown = () => {
    const newElem: InteractiveElement = {
      id: `select-${Date.now()}`,
      type: 'select_dropdown',
      x: 35,
      y: 45,
      width: 22,
      height: 6,
      correctAnswer: 'Opción 1',
      options: ['Opción 1', 'Opción 2', 'Opción 3'],
      placeholder: 'Selecciona...',
      points: 1,
      fontSize: 14,
    };
    setWorksheet(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedElementId(newElem.id);
  };

  const handleAddConnectDotPair = () => {
    const pairId = `pareja-${Date.now().toString().slice(-4)}`;
    const dotA: InteractiveElement = {
      id: `dot-a-${Date.now()}`,
      type: 'connect_dot',
      x: 25,
      y: 50,
      width: 4,
      height: 3,
      correctAnswer: '',
      pairId: pairId,
      dotRole: 'start',
      dotLabel: 'A',
      dotColor: '#392a79',
      points: 1,
    };
    const dotB: InteractiveElement = {
      id: `dot-b-${Date.now() + 1}`,
      type: 'connect_dot',
      x: 65,
      y: 50,
      width: 4,
      height: 3,
      correctAnswer: '',
      pairId: pairId,
      dotRole: 'end',
      dotLabel: 'B',
      dotColor: '#52b68e',
      points: 1,
    };
    setWorksheet(prev => ({ ...prev, elements: [...prev.elements, dotA, dotB] }));
    setSelectedElementId(dotA.id);
  };

  const handleAddHotspot = () => {
    const newElem: InteractiveElement = {
      id: `check-${Date.now()}`,
      type: 'hotspot_choice',
      choiceMode: 'checkbox',
      x: 40,
      y: 60,
      width: 6,
      height: 5,
      correctAnswer: 'true',
      points: 1,
    };
    setWorksheet(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedElementId(newElem.id);
  };

  const handleAddTrueFalse = () => {
    const newElem: InteractiveElement = {
      id: `tf-${Date.now()}`,
      type: 'hotspot_choice',
      choiceMode: 'true_false',
      x: 40,
      y: 60,
      width: 10,
      height: 5.5,
      correctAnswer: 'V',
      points: 1,
    };
    setWorksheet(prev => ({ ...prev, elements: [...prev.elements, newElem] }));
    setSelectedElementId(newElem.id);
  };

  const handleUpdateElement = (updated: InteractiveElement) => {
    setWorksheet(prev => ({
      ...prev,
      elements: prev.elements.map(el => (el.id === updated.id ? updated : el)),
    }));
  };

  const handleDeleteElement = (id: string) => {
    setWorksheet(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (el: InteractiveElement) => {
    const dup: InteractiveElement = {
      ...el,
      id: `${el.type}-${Date.now()}`,
      x: Math.min(80, el.x + 3),
      y: Math.min(80, el.y + 3),
    };
    setWorksheet(prev => ({ ...prev, elements: [...prev.elements, dup] }));
    setSelectedElementId(dup.id);
  };

  // Student Connection handling
  const handleAddConnection = (fromId: string, toId: string) => {
    // Remove previous connection from or to these dots
    setStudentConnections(prev => {
      const filtered = prev.filter(c => !(c.fromId === fromId || c.toId === fromId || c.fromId === toId || c.toId === toId));
      return [...filtered, { id: `conn-${Date.now()}`, fromId, toId }];
    });
  };

  const handleRemoveConnection = (connectionId: string) => {
    setStudentConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  // Evaluate Worksheet
  const handleEvaluate = () => {
    let earned = 0;
    let total = 0;
    const elementResults: Record<string, boolean> = {};
    const connectionResults: Record<string, boolean> = {};

    // 1. Grade Text Inputs & Dropdowns & Hotspots
    worksheet.elements.forEach(elem => {
      if (elem.type === 'text_input' || elem.type === 'select_dropdown' || elem.type === 'hotspot_choice') {
        const pts = elem.points || 1;
        total += pts;
        const answer = studentAnswers[elem.id] || '';
        const isOk = checkAnswer(answer, elem);
        elementResults[elem.id] = isOk;
        if (isOk) earned += pts;
      }
    });

    // 2. Grade Connect Dots
    // Group teacher dots by pairId
    const pairGroups = new Map<string, string[]>();
    worksheet.elements
      .filter(el => el.type === 'connect_dot' && el.pairId)
      .forEach(el => {
        const list = pairGroups.get(el.pairId!) || [];
        list.push(el.id);
        pairGroups.set(el.pairId!, list);
      });

    // Each pair group constitutes points
    pairGroups.forEach((dotIds, pairKey) => {
      total += 1;
      // Check if student connected any 2 dots in this pair
      const matched = studentConnections.some(c =>
        (dotIds.includes(c.fromId) && dotIds.includes(c.toId))
      );
      if (matched) earned += 1;
    });

    studentConnections.forEach(conn => {
      const ok = checkConnection(conn, worksheet.elements);
      connectionResults[conn.id] = ok;
    });

    const pct = total > 0 ? Math.round((earned / total) * 100) : 100;

    setEvaluation({
      totalPoints: total,
      earnedPoints: earned,
      percentage: pct,
      elementResults,
      connectionResults,
      completedCount: Object.keys(studentAnswers).length + studentConnections.length,
      totalCount: worksheet.elements.length,
    });
    setIsEvaluated(true);
  };

  const selectedElement = worksheet.elements.find(el => el.id === selectedElementId) || null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Hidden file input for PNG/JPG upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Bar following Top Bar Contract (1 row, 3 zones, gap-8) */}
      <header className="bg-white border-b border-slate-200/90 px-6 py-3.5 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark with Official Brand Logo */}
          <a
            href="/"
            className="flex items-center gap-2 shrink-0 py-0.5 group"
            title="Didáctica · EduFichas Interactivas"
          >
            <BrandLogo height={38} className="transition-transform group-hover:scale-102" />
          </a>

          {/* Zone 2: Navigation Links & Actions */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setShowSampleSelector(!showSampleSelector)}
              className="hover:text-[#392a79] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen size={14} className="text-[#52b68e]" />
              Plantillas de Primaria
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-[#392a79] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} className="text-[#392a79]" />
              Subir Imagen PNG
            </button>

            <button
              onClick={() => setIsCloudflareModalOpen(true)}
              className="hover:text-[#392a79] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} className="text-[#392a79]" />
              Exportar Ficha
            </button>

            <button
              onClick={() => setShowGuideModal(true)}
              className="hover:text-[#392a79] transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={14} className="text-amber-500" />
              Guía de Uso
            </button>
          </nav>

          {/* Zone 3: Primary Action Toggle (Editor <-> Estudiante) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-100 p-1 rounded-md flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('editor');
                  resetStudentState();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  mode === 'editor'
                    ? 'bg-[#392a79] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 size={13} />
                Editor
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('student');
                  setSelectedElementId(null);
                  resetStudentState();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  mode === 'student'
                    ? 'bg-[#52b68e] text-[#0d3824] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play size={13} fill="currentColor" />
                Modo Alumno
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sample Templates Dropdown Bar (if toggled) */}
      {showSampleSelector && (
        <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Sparkles size={15} className="text-[#52b68e]" />
              Selecciona una ficha de muestra:
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_WORKSHEETS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setWorksheet(sample);
                    setSelectedElementId(null);
                    resetStudentState();
                    setShowSampleSelector(false);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-md font-semibold border transition-all ${
                    worksheet.id === sample.id
                      ? 'bg-[#392a79] text-white border-[#392a79]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {sample.title} ({sample.subject})
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSampleSelector(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Worksheet Header Strip */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Título de la Ficha Educativa
              </label>
              {mode === 'editor' && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {worksheet.title.length} caracteres
                </span>
              )}
            </div>
            {mode === 'editor' ? (
              <input
                type="text"
                value={worksheet.title}
                onChange={e => setWorksheet(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-base sm:text-lg font-bold text-[#392a79] bg-white border border-slate-300 focus:border-[#392a79] rounded-md px-3.5 py-2.5 outline-none transition-all shadow-2xs leading-normal"
                placeholder="Escribe el título de tu ficha educativa..."
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-black text-[#392a79] leading-snug break-words">
                {worksheet.title}
              </h1>
            )}
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xs"
                title="Alejar"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-slate-600">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xs"
                title="Acercar"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {mode === 'student' && !isEvaluated && (
              <button
                type="button"
                onClick={handleEvaluate}
                className="px-4 py-2 bg-[#52b68e] hover:bg-[#43a17b] text-[#0d3824] rounded-md text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 size={16} />
                Comprobar Respuestas
              </button>
            )}

            {mode === 'editor' && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={14} />
                  Cambiar PNG
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloudflareModalOpen(true)}
                  className="px-3.5 py-2 bg-[#392a79] hover:bg-[#2c2060] text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 size={14} />
                  Exportar / Cloudflare
                </button>
              </>
            )}
          </div>
        </div>

        {/* Student Score Feedback Banner (when evaluated) */}
        {mode === 'student' && isEvaluated && evaluation && (
          <StudentScoreBanner
            evaluation={evaluation}
            showAnswers={showAnswers}
            onToggleShowAnswers={() => setShowAnswers(!showAnswers)}
            onRetry={resetStudentState}
          />
        )}

        {/* Editor Palette of Tools */}
        {mode === 'editor' && (
          <div className="bg-white rounded-md p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                <Plus size={14} className="text-[#392a79]" /> Agregar elementos:
              </span>

              <button
                type="button"
                onClick={handleAddTextInput}
                className="px-3 py-1.5 bg-[#392a79]/10 hover:bg-[#392a79]/20 text-[#392a79] border border-[#392a79]/20 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir celda para que el alumno escriba texto o números"
              >
                <Type size={14} className="text-[#392a79]" /> Celda de Autollenado
              </button>

              <button
                type="button"
                onClick={handleAddSelectDropdown}
                className="px-3 py-1.5 bg-[#52b68e]/15 hover:bg-[#52b68e]/25 text-[#166534] border border-[#52b68e]/30 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir celda con menú de opciones desplegable"
              >
                <List size={14} className="text-[#52b68e]" /> Lista de Selección
              </button>

              <button
                type="button"
                onClick={handleAddConnectDotPair}
                className="px-3 py-1.5 bg-[#eb6281]/15 hover:bg-[#eb6281]/25 text-[#a82245] border border-[#eb6281]/30 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir pareja de puntos A y B para unir con línea"
              >
                <LinkIcon size={14} className="text-[#eb6281]" /> Pareja Punto a Punto
              </button>

              <button
                type="button"
                onClick={handleAddHotspot}
                className="px-3 py-1.5 bg-[#ffcf23]/20 hover:bg-[#ffcf23]/35 text-[#855e00] border border-[#ffcf23]/50 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir casilla de verificación (✓ / errónea)"
              >
                <CheckSquare size={14} className="text-[#c28f00]" /> Casilla (✓)
              </button>

              <button
                type="button"
                onClick={handleAddTrueFalse}
                className="px-3 py-1.5 bg-emerald-100/60 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir selector Verdadero (V) / Falso (F)"
              >
                <span className="font-black text-xs text-emerald-700">V/F</span> Verdadero o Falso
              </button>
            </div>
          </div>
        )}

        {/* Workspace Canvas + Sidebar (Flex Layout so Zoom NEVER overlaps the Inspector) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Canvas Section - strictly bounded and scroll-isolated */}
          <div className="flex-1 min-w-0 w-full overflow-hidden">
            <WorksheetCanvas
              mode={mode}
              imageUrl={worksheet.imageUrl}
              elements={worksheet.elements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              studentAnswers={studentAnswers}
              onStudentAnswerChange={(id, val) => setStudentAnswers(prev => ({ ...prev, [id]: val }))}
              studentConnections={studentConnections}
              onAddConnection={handleAddConnection}
              onRemoveConnection={handleRemoveConnection}
              isEvaluated={isEvaluated}
              elementResults={evaluation?.elementResults}
              connectionResults={evaluation?.connectionResults}
              showAnswers={showAnswers}
              zoomLevel={zoomLevel}
            />
          </div>

          {/* Editor Right Inspector - fixed width sidebar, sticky, never obscured */}
          {mode === 'editor' && (
            <aside className="w-full lg:w-80 lg:shrink-0 space-y-4 sticky top-20 z-20">
              <ElementInspector
                element={selectedElement}
                onUpdate={handleUpdateElement}
                onDelete={handleDeleteElement}
                onDuplicate={handleDuplicateElement}
                allElements={worksheet.elements}
              />

              {/* Elements List Outline */}
              <div className="bg-white border border-slate-200/90 rounded-md p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Celdas ({worksheet.elements.length})
                  </h4>
                  {worksheet.elements.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Seguro que deseas eliminar todas las celdas?')) {
                          setWorksheet(prev => ({ ...prev, elements: [] }));
                          setSelectedElementId(null);
                        }
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                    >
                      <Trash2 size={12} /> Limpiar todo
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs">
                  {worksheet.elements.length === 0 ? (
                    <p className="text-slate-400 text-[11px] italic py-2 text-center">
                      No hay celdas agregadas. Usa los botones de arriba para añadir celdas de autollenado, listas o puntos.
                    </p>
                  ) : (
                    worksheet.elements.map((el, i) => (
                      <button
                        key={el.id}
                        type="button"
                        onClick={() => setSelectedElementId(el.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                          selectedElementId === el.id
                            ? 'bg-[#392a79] text-white font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">
                          {i + 1}. {el.type === 'text_input' ? '✍️ ' : el.type === 'select_dropdown' ? '📋 ' : el.type === 'connect_dot' ? '🔗 ' : '☑️ '}
                          {el.correctAnswer || el.dotLabel || el.pairId || 'Celda'}
                        </span>
                        <span className="text-[10px] opacity-75 shrink-0 ml-1">
                          {el.points} pt
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Cloudflare Export Modal */}
      <CloudflareExportModal
        worksheet={worksheet}
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
      />

      {/* Usage Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-[#392a79] text-base flex items-center gap-2">
                <BookOpen size={18} className="text-[#52b68e]" />
                ¿Cómo funciona EduFichas Interactivas?
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-purple-50 rounded-md border border-purple-100">
                <strong className="text-[#392a79] block mb-1">1. Sube tu imagen en formato PNG o JPG</strong>
                Puedes tomar una foto o subir una página de cualquier libro escolar o guía de actividades de primaria.
              </div>

              <div className="p-3 bg-emerald-50 rounded-md border border-emerald-100">
                <strong className="text-[#166534] block mb-1">2. Añade celdas interactivas y muévelas</strong>
                - <strong>Autollenado:</strong> El alumno escribe la palabra o número exacto.<br/>
                - <strong>Lista de selección:</strong> Menú desplegable con opciones que tú defines.<br/>
                - <strong>Punto a punto:</strong> Coloca dos puntos y el alumno podrá trazar una línea interactiva entre ellos.
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <strong className="text-slate-800 block mb-1">3. Prueba como Alumno y Califica</strong>
                Cambia al botón "Modo Alumno" para ver cómo lo resolverá el estudiante con autocalificación y fuegos artificiales.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-[#392a79] text-white text-xs font-bold rounded-md"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#52b68e]" />
            <span>EduFichas Interactivas · Creador de Fichas Escolares</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Fichas Autónomas HTML</span>
            <span>·</span>
            <span>Autocalificación y Conexión de Puntos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
