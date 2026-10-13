import React, { useState } from 'react';
import { WorksheetData } from '../types';
import { generateStandaloneHTML } from '../utils/helpers';
import { Download, Cloud, Copy, Check, FileCode, Sparkles, ExternalLink, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface CloudflareExportModalProps {
  worksheet: WorksheetData;
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareExportModal: React.FC<CloudflareExportModalProps> = ({
  worksheet,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadStandaloneHTML = () => {
    const html = generateStandaloneHTML(worksheet);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${worksheet.title.toLowerCase().replace(/\s+/g, '-')}-interactiva.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(worksheet, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${worksheet.title.toLowerCase().replace(/\s+/g, '-')}-plantilla.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHTML = () => {
    const html = generateStandaloneHTML(worksheet);
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-md max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#392a79] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white rounded-xs shadow-sm">
              <BrandLogo height={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Exportar Ficha Interactiva</h3>
              <p className="text-xs text-purple-200">
                Descarga tu ficha educativa interactiva lista para usar offline o compartir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1 rounded-sm hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadStandaloneHTML}
              className="group p-4 text-left border-2 border-slate-200 hover:border-[#52b68e] hover:bg-[#52b68e]/5 rounded-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#52b68e]/20 text-[#392a79] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileCode size={18} strokeWidth={2.5} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Descargar Ficha HTML Autónoma</h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Archivo .html único con la imagen incrustada. Se abre en cualquier navegador o celular sin instalar nada.
                </p>
              </div>
              <span className="text-xs font-bold text-[#52b68e] flex items-center gap-1 mt-3">
                <Download size={14} /> Descargar .HTML
              </span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="group p-4 text-left border-2 border-slate-200 hover:border-[#392a79] hover:bg-[#392a79]/5 rounded-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#392a79]/15 text-[#392a79] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Download size={18} strokeWidth={2.5} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Exportar Plantilla JSON</h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Guarda la configuración y respuestas para volver a editarla cuando quieras.
                </p>
              </div>
              <span className="text-xs font-bold text-[#392a79] flex items-center gap-1 mt-3">
                <Download size={14} /> Descargar .JSON
              </span>
            </button>
          </div>

          {/* Quick Copy */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-xs text-slate-600 font-medium">
              ¿Quieres insertar la ficha en tu blog escolar o Classroom?
            </div>
            <button
              onClick={handleCopyHTML}
              className="px-3 py-1.5 bg-[#392a79] hover:bg-[#2e2163] text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={14} className="text-[#52b68e]" /> : <Copy size={14} />}
              {copied ? '¡Copiado!' : 'Copiar Código'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
