import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, RotateCcw, Eye, EyeOff, Printer, Star } from 'lucide-react';
import { EvaluationResult } from '../types';

interface StudentScoreBannerProps {
  evaluation: EvaluationResult;
  showAnswers: boolean;
  onToggleShowAnswers: () => void;
  onRetry: () => void;
}

export const StudentScoreBanner: React.FC<StudentScoreBannerProps> = ({
  evaluation,
  showAnswers,
  onToggleShowAnswers,
  onRetry,
}) => {
  const isGreat = evaluation.percentage >= 80;
  const isMedium = evaluation.percentage >= 60 && evaluation.percentage < 80;

  useEffect(() => {
    if (isGreat) {
      confetti({
        particleCount: 140,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#392a79', '#52b68e', '#eb6281', '#ffcf23'],
      });
    }
  }, [isGreat]);

  const starCount = evaluation.percentage >= 90 ? 3 : evaluation.percentage >= 60 ? 2 : 1;

  return (
    <div
      className={`rounded-md p-5 mb-5 border shadow-md transition-all ${
        isGreat
          ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
          : isMedium
          ? 'bg-amber-50/95 border-[#ffcf23] text-amber-950'
          : 'bg-rose-50/95 border-[#eb6281]/40 text-rose-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left score and encouragement */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div
            className={`w-14 h-14 rounded-md flex items-center justify-center font-extrabold text-2xl shadow-sm ${
              isGreat
                ? 'bg-[#ffcf23] text-[#392a79]'
                : isMedium
                ? 'bg-[#ffcf23] text-[#392a79]'
                : 'bg-[#eb6281] text-white'
            }`}
          >
            <Award size={32} strokeWidth={2.5} />
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                {evaluation.earnedPoints} / {evaluation.totalPoints} puntos
              </span>
              <span
                style={{
                  backgroundColor: isGreat ? '#52b68e' : isMedium ? '#ffcf23' : '#eb6281',
                  color: isMedium ? '#392a79' : '#ffffff',
                }}
                className="font-extrabold text-xs px-2.5 py-0.5 rounded-sm shadow-2xs"
              >
                {evaluation.percentage}%
              </span>

              {/* Cheerful 3-Star Rating */}
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3].map(starIndex => (
                  <Star
                    key={starIndex}
                    size={16}
                    fill={starIndex <= starCount ? '#ffcf23' : '#cbd5e1'}
                    className={starIndex <= starCount ? 'text-[#ffcf23]' : 'text-slate-300'}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5">
              {isGreat
                ? '🌟 ¡Excelente trabajo! Has completado la ficha con éxito.'
                : isMedium
                ? '👍 ¡Buen intento! Repasa los detalles marcados en rojo para alcanzar 3 estrellas.'
                : '💪 ¡Ánimo! Puedes volver a intentarlo para conseguir una mejor nota.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleShowAnswers}
            className="px-3.5 py-2 text-xs font-bold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            {showAnswers ? <EyeOff size={15} /> : <Eye size={15} />}
            {showAnswers ? 'Ocultar Solución' : 'Ver Solución'}
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-2 text-xs font-bold rounded-md bg-[#392a79] text-white hover:bg-[#2c2060] transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw size={15} />
            Reintentar
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-bold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Imprimir ficha con tu calificación"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
