
import React from 'react';
import { UserProfile, KickSession, TRANSLATIONS, TabView, WeeklyInsight, parseLocalDate, CountMethod } from '../types';
import { differenceInCalendarDays, format } from 'date-fns';
import { Clock, ChevronRight, Sparkles, PlayCircle, AlertCircle, MousePointerClick, RotateCcw } from 'lucide-react';

interface Props {
  profile: UserProfile;
  sessions: KickSession[];
  onStartSession: () => void;
  onChangeTab: (tab: TabView) => void;
  currentWeeks: number;
  currentDays: number;
  weeklyInsight: WeeklyInsight | null;
  
  // Counter Props
  counterStatus: 'idle' | 'active' | 'summary';
  counterSeconds: number;
  counterValid: number;
  counterRaw: number;
  counterMethod: CountMethod;
  onKick: () => void;
  onViewResults: () => void;
}

const Dashboard: React.FC<Props> = ({ 
  profile, 
  sessions, 
  onStartSession, 
  onChangeTab, 
  currentWeeks, 
  currentDays,
  weeklyInsight,
  counterStatus,
  counterSeconds,
  counterValid,
  counterRaw,
  counterMethod,
  onKick,
  onViewResults
}) => {
  const t = TRANSLATIONS[profile.language || 'zh'];

  // Timezone helper to format HH:mm in user's selected timezone
  const formatSessionTime = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: profile.timezone
      }).format(new Date(timestamp));
    } catch (e) {
      // Fallback to local if timezone is invalid
      return format(new Date(timestamp), 'HH:mm');
    }
  };

  // Check equality in specific timezone is tricky without date-fns-tz, 
  // so we rely on simple date string comparison via Intl for filtering "Today"
  const isTodayInTimezone = (timestamp: number) => {
      try {
        const dateInTz = new Intl.DateTimeFormat('en-CA', { // YYYY-MM-DD
            year: 'numeric', month: '2-digit', day: '2-digit',
            timeZone: profile.timezone
        }).format(new Date(timestamp));
        
        const todayInTz = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            timeZone: profile.timezone
        }).format(new Date());
        
        return dateInTz === todayInTz;
      } catch (e) {
          return new Date(timestamp).toDateString() === new Date().toDateString();
      }
  };

  const todaysSessions = sessions.filter(s => isTodayInTimezone(s.startTime))
                                 .sort((a, b) => b.startTime - a.startTime); 
  
  const localDueDate = parseLocalDate(profile.dueDate);
  const todayLocal = new Date(); 
  todayLocal.setHours(0, 0, 0, 0);
  const daysLeft = differenceInCalendarDays(localDueDate, todayLocal);

  // Timer formatting for active session on dashboard
  const maxSeconds = counterMethod === '1h' ? 3600 : 7200;
  const remaining = Math.max(0, maxSeconds - counterSeconds);
  const formatMin = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to get localized anomaly text
  const getAnomalyText = (status?: string) => {
      if (status === 'low' || status === 'medium') return t.anomalyLowMessage;
      if (status === 'high') return t.anomalyHighMessage;
      return t.anomalyGeneric;
  };

  return (
    <div className="space-y-5 p-4 pb-32">
      {/* Header Card - Softer Gradient */}
      <div className="bg-gradient-to-br from-rose-300 to-pink-400 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <h2 className="text-xl font-bold relative z-10">Hi, {profile.name}</h2>
        
        <div className="mt-4 flex justify-between items-end relative z-10">
          <div>
            <p className="text-rose-50 text-xs font-medium uppercase tracking-wider mb-1">{t.currentProgress}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">
                  {currentWeeks} <span className="text-lg font-normal">{t.weeks}</span> {currentDays} <span className="text-lg font-normal">{t.days}</span>
                </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-rose-50 text-xs uppercase">{t.due}</p>
            <p className="font-semibold">{format(localDueDate, 'yyyy/MM/dd')}</p>
            <p className="text-xs mt-1 bg-white/20 px-2 py-1 rounded-lg inline-block">
                {t.distanceToDue} {Math.max(0, daysLeft)} {t.days}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Highlight Card */}
      <div 
        onClick={() => onChangeTab(TabView.GUIDE)}
        className="bg-white rounded-xl p-4 border border-rose-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-98 transition hover:border-rose-200"
      >
        <div className="flex gap-3 items-start flex-1">
            <div className="bg-indigo-50 p-2 rounded-full text-indigo-400 mt-1 shrink-0">
                <Sparkles className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-gray-700 text-sm">{t.guide} · {currentWeeks}W</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">
                    {weeklyInsight ? weeklyInsight.momSymptoms.replace(/(\d+\.\s)/g, '') : t.loadingAdvice}
                </p>
            </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 ml-2" />
      </div>

      {/* Action Card (Dynamic) */}
      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100">
        <div className="flex justify-between items-center mb-3">
             <h3 className="text-base font-bold text-gray-700">
                 {counterStatus === 'active' ? t.countingActive : (counterStatus === 'summary' ? t.sessionComplete : t.timeToCount)}
             </h3>
             {counterStatus === 'active' && (
                 <span className="text-xs font-mono text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                     {formatMin(remaining)}
                 </span>
             )}
        </div>
        
        {counterStatus === 'active' ? (
            <button 
              onClick={onKick}
              className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-rose-200 shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <MousePointerClick className="w-6 h-6 animate-bounce" />
              <div className="text-left leading-none">
                  <div className="text-lg">{t.tapToRecord}</div>
                  <div className="text-[10px] opacity-80 uppercase tracking-wide mt-0.5">
                    {t.validKicks}: {counterValid} <span className="opacity-70">({counterRaw})</span>
                  </div>
              </div>
            </button>
        ) : counterStatus === 'summary' ? (
            <button 
              onClick={onViewResults}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              {t.viewResults}
            </button>
        ) : (
            <button 
              onClick={onStartSession}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlayCircle className="w-5 h-5" />
              {t.startCounter}
            </button>
        )}

        {counterStatus === 'idle' && (
            <p className="text-gray-400 text-xs mt-3 text-center px-4 leading-relaxed">
              {t.countAdvice}
            </p>
        )}
      </div>

      {/* Today's Records List */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-base font-bold text-gray-700">{t.todaysRecords}</h3>
            <button onClick={() => onChangeTab(TabView.TRENDS)} className="text-xs text-gray-900 font-bold hover:text-black">{t.recentSessions} &rarr;</button>
        </div>
        
        {todaysSessions.length === 0 ? (
          <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 text-sm">
            {profile.language === 'zh' ? '今日暂无记录' : 'No records for today'}
          </div>
        ) : (
          <div className="space-y-3">
            {todaysSessions.map((session) => {
              const isAnomaly = session.anomalyStatus === 'high' || session.anomalyStatus === 'medium';
              return (
                <div key={session.id} className="space-y-2">
                    <div 
                      className={`bg-white p-3 rounded-xl shadow-sm border flex justify-between items-center transition-all ${
                        isAnomaly ? 'border-pink-300 ring-1 ring-pink-100 animate-subtle-pulse' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAnomaly ? 'bg-pink-50 text-pink-500' : (session.method === '1h' ? 'bg-rose-50 text-rose-400' : 'bg-indigo-50 text-indigo-400')}`}>
                          {isAnomaly ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isAnomaly ? 'text-pink-600' : 'text-gray-700'}`}>
                              {formatSessionTime(session.startTime)} 
                              <span className={`text-xs font-normal ml-2 ${isAnomaly ? 'text-pink-400' : 'text-gray-400'}`}>
                                  ({Math.floor(session.durationSeconds/60)}m)
                              </span>
                          </p>
                          <p className={`text-xs ${isAnomaly ? 'text-pink-400' : 'text-gray-500'}`}>
                            {session.method === '1h' ? t.standardCount : t.extendedCheck}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isAnomaly ? 'text-pink-500' : 'text-gray-700'}`}>
                          {session.count} <span className={`text-xs font-normal ${isAnomaly ? 'text-pink-300' : 'text-gray-400'}`}>/ {session.rawCount}</span>
                        </p>
                        <p className={`text-[10px] uppercase tracking-wider ${isAnomaly ? 'text-pink-400' : 'text-gray-400'}`}>{t.kicksToday}</p>
                      </div>
                    </div>
                    
                    {isAnomaly && (
                        <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 text-sm text-pink-700 animate-subtle-pulse mx-1">
                            <p className="font-bold text-xs mb-1">{t.anomalyReason}</p>
                            {/* Use dynamic text based on status, not the stored string */}
                            <p className="whitespace-pre-line leading-relaxed text-xs">{getAnomalyText(session.anomalyStatus)}</p>
                            <p className="mt-2 text-[10px] opacity-60 border-t border-pink-200 pt-1">{t.aiDisclaimer}</p>
                        </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
