
import React, { useState, useEffect } from 'react';
import { CountMethod, KickSession, Language, TRANSLATIONS, AnomalyAnalysis } from '../types';
import { Play, Square, Footprints, Timer, AlertTriangle, CheckCircle2, Activity, Info } from 'lucide-react';

interface Props {
  week: number;
  history: KickSession[];
  language: Language;
  
  // Controlled State
  status: 'idle' | 'active' | 'summary';
  method: CountMethod;
  seconds: number;
  validCount: number;
  rawCount: number;
  finishedSession: KickSession | null;

  // Actions
  onSetMethod: (m: CountMethod) => void;
  onStart: (m: CountMethod) => void;
  onKick: () => void;
  onFinish: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const KickCounter: React.FC<Props> = ({ 
    status, method, seconds, validCount, rawCount, finishedSession,
    onSetMethod, onStart, onKick, onFinish, onSave, onCancel, language 
}) => {
  const t = TRANSLATIONS[language];
  
  // Display state for summary (derived from finishedSession if available)
  const [anomalyDisplay, setAnomalyDisplay] = useState<{title: string, msg: string, color: string} | null>(null);

  useEffect(() => {
      if (status === 'summary' && finishedSession) {
          // Anomaly logic is pre-calculated in App, but we need to format it for display
          const severity = finishedSession.anomalyStatus;
          const isBad = severity === 'high' || severity === 'medium';
          
          if (isBad) {
              setAnomalyDisplay({
                  title: language === 'zh' ? "需要注意" : "Attention Needed",
                  msg: language === 'zh' ? "胎动次数偏少，请参考医学建议。" : "Movement seems low.",
                  color: "text-amber-600 bg-amber-50 border-amber-200"
              });
          } else {
              setAnomalyDisplay({
                  title: language === 'zh' ? "表现极佳" : "Great Job!",
                  msg: language === 'zh' ? "宝宝的胎动模式很正常。" : "Movement patterns look normal.",
                  color: "text-green-600 bg-green-50 border-green-200"
              });
          }
      }
  }, [status, finishedSession, language]);


  // --- Countdown Logic ---
  const maxSeconds = method === '1h' ? 3600 : 7200;
  const remainingSeconds = Math.max(0, maxSeconds - seconds);
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Summary View ---
  if (status === 'summary') {
    return (
      <div className="p-6 flex flex-col h-full items-center justify-center space-y-6 bg-white pb-32">
        <div className="text-center w-full flex-1 flex flex-col justify-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${anomalyDisplay?.color.includes('amber') ? 'bg-amber-100' : 'bg-green-100'}`}>
                {anomalyDisplay?.color.includes('amber') ? <AlertTriangle className="w-10 h-10 text-amber-500" /> : <CheckCircle2 className="w-10 h-10 text-green-500" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{t.sessionComplete}</h2>
            
            <div className="mt-8 flex justify-center gap-4 text-center w-full">
                <div className="flex-1 bg-rose-50 p-4 rounded-xl">
                    <p className="text-4xl font-bold text-rose-500">{finishedSession?.count || 0}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold mt-1">{t.validKicks}</p>
                </div>
                <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                    <p className="text-4xl font-bold text-gray-400">{finishedSession?.rawCount || 0}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold mt-1">{t.rawKicks}</p>
                </div>
            </div>

            {anomalyDisplay && (
                <div className={`mt-6 p-4 rounded-xl border ${anomalyDisplay.color} text-sm text-left w-full whitespace-pre-wrap`}>
                    <p className="font-bold mb-1 text-base">{anomalyDisplay.title}</p>
                    <p className="leading-relaxed opacity-90">{anomalyDisplay.msg}</p>
                    <p className="mt-2 text-xs opacity-75 italic border-t border-current pt-2">{t.aiDisclaimer}</p>
                </div>
            )}
        </div>

        <div className="flex gap-4 w-full mt-auto">
            <button onClick={onCancel} className="flex-1 py-4 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50">{t.discard}</button>
            <button onClick={onSave} className="flex-1 py-4 rounded-xl bg-rose-400 text-white font-bold shadow-md hover:bg-rose-500">{t.saveRecord}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative bg-slate-50 pb-28">
      {/* Header Settings */}
      {status === 'idle' && (
        <div className="p-4 bg-white shadow-sm z-10">
          <h2 className="text-center font-bold text-gray-700 mb-4">{t.selectMethod}</h2>
          <div className="flex gap-4">
            <button
              onClick={() => onSetMethod('1h')}
              className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all ${
                method === '1h' ? 'border-rose-400 bg-rose-50 text-rose-600 font-bold shadow-sm' : 'border-slate-100 bg-white text-gray-400'
              }`}
            >
              1 Hour
              <span className="block text-xs font-normal opacity-70 mt-1">{t.standardCount}</span>
            </button>
            <button
              onClick={() => onSetMethod('2h')}
              className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all ${
                method === '2h' ? 'border-rose-400 bg-rose-50 text-rose-600 font-bold shadow-sm' : 'border-slate-100 bg-white text-gray-400'
              }`}
            >
              2 Hours
              <span className="block text-xs font-normal opacity-70 mt-1">{t.extendedCheck}</span>
            </button>
          </div>
          <div className="mt-4 bg-blue-50 text-blue-600 p-3 rounded-lg text-xs flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{language === 'zh' ? '医学说明：为了过滤假性胎动，5分钟内的连续点击只会记录为1次有效胎动。' : 'Medical Note: Continuous taps within 5 minutes are grouped as 1 valid movement.'}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-between py-6 min-h-0">
         {/* Timer */}
         <div className="flex flex-col items-center mt-4">
             <div className="text-6xl font-mono font-bold text-slate-700 mb-2 tracking-wider tabular-nums">
                 {formatTime(remainingSeconds)}
             </div>
         </div>

         {/* Main Interaction Button */}
         <div className="flex-1 flex items-center justify-center w-full max-h-[50vh]">
             {status === 'idle' ? (
                 <button
                    onClick={() => onStart(method)}
                    className="w-56 h-56 rounded-full bg-rose-400 shadow-rose-200 shadow-2xl hover:bg-rose-500 transition-all transform hover:scale-105 flex flex-col items-center justify-center text-white"
                 >
                     <Play className="w-20 h-20 ml-2 mb-2 fill-white" />
                     <span className="text-xl font-bold uppercase tracking-widest">{t.startCounter}</span>
                 </button>
             ) : (
                 <button
                    onClick={onKick}
                    className="w-64 h-64 rounded-full bg-gradient-to-b from-rose-300 to-rose-400 shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center text-white border-8 border-rose-100 relative touch-manipulation"
                 >
                     <Footprints className="w-24 h-24 mb-2 opacity-90" />
                     <span className="text-7xl font-bold">{validCount}</span>
                     <span className="text-sm uppercase tracking-widest opacity-80 mt-1">{t.validKicks}</span>
                     
                     <div className="absolute -bottom-12 flex flex-col items-center">
                         <div className="bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                             {rawCount} {t.rawKicks}
                         </div>
                     </div>
                     
                     <div className="absolute -top-12 text-gray-400 text-sm animate-pulse font-bold tracking-wide w-full text-center">
                        {t.tapToCount}
                     </div>
                 </button>
             )}
         </div>
      </div>

      {/* Footer Actions */}
      {status === 'active' && (
          <div className="px-6 pt-4 pb-6">
              <button
                onClick={onFinish}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition"
              >
                  <Square className="w-5 h-5 fill-current" />
                  {t.finishSession}
              </button>
          </div>
      )}
    </div>
  );
};

export default KickCounter;