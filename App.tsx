
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, TabView, KickSession, TRANSLATIONS, Language, WeeklyInsight, parseLocalDate, CountMethod } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import KickCounter from './components/KickCounter';
import Trends from './components/Trends';
import WeeklyGuide from './components/WeeklyGuide';
import Profile from './components/Profile';
import { getWeeklyInsight, analyzeKickAnomaly } from './services/geminiService';
import { differenceInCalendarDays } from 'date-fns';
import { Home, Activity, TrendingUp, BookOpen, User } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<KickSession[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Global Kick Counter State
  const [counterStatus, setCounterStatus] = useState<'idle' | 'active' | 'summary'>('idle');
  const [counterMethod, setCounterMethod] = useState<CountMethod>('1h');
  const [counterStartTime, setCounterStartTime] = useState<number>(0);
  const [counterSeconds, setCounterSeconds] = useState(0);
  const [counterValid, setCounterValid] = useState(0);
  const [counterRaw, setCounterRaw] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [finishedSession, setFinishedSession] = useState<KickSession | null>(null);
  
  // Weekly Insight State
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [isFetchingInsight, setIsFetchingInsight] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper for text
  const lang: Language = profile?.language || 'zh';
  const t = TRANSLATIONS[lang];

  // --- Persistence ---
  useEffect(() => {
    const savedProfile = localStorage.getItem('babykicks_profile');
    const savedHistory = localStorage.getItem('babykicks_history');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (profile) localStorage.setItem('babykicks_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('babykicks_history', JSON.stringify(history));
  }, [history]);

  // --- Date Logic ---
  const { weeks, days } = useMemo(() => {
    if (!profile) return { weeks: 0, days: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const due = parseLocalDate(profile.dueDate);
    const daysRemaining = differenceInCalendarDays(due, today);
    const daysElapsed = 280 - daysRemaining;
    const w = Math.floor(daysElapsed / 7);
    const d = daysElapsed % 7;
    return { 
        weeks: w > 0 && w <= 42 ? w : 0, 
        days: d >= 0 ? d : 0 
    };
  }, [profile]);

  // --- Weekly Insight Fetching with Cache ---
  useEffect(() => {
    if (profile && weeks > 0) {
      const cacheKey = `babykicks_insight_week_${weeks}_${profile.language}_${profile.timezone}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
            setWeeklyInsight(JSON.parse(cached));
            return; // Skip fetch if cached
        } catch (e) {
            console.error("Cache parse error", e);
        }
      }

      setIsFetchingInsight(true);
      getWeeklyInsight(weeks, profile.language, profile.timezone)
        .then(data => {
          setWeeklyInsight(data);
          localStorage.setItem(cacheKey, JSON.stringify(data)); // Save to cache
          setIsFetchingInsight(false);
        })
        .catch(() => setIsFetchingInsight(false));
    }
  }, [weeks, profile?.language, profile?.timezone]);


  // --- Counter Logic ---
  useEffect(() => {
    if (counterStatus === 'active') {
      timerRef.current = setInterval(() => {
        setCounterSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [counterStatus]);

  // Auto-stop
  useEffect(() => {
      const maxSeconds = counterMethod === '1h' ? 3600 : 7200;
      if (counterStatus === 'active' && counterSeconds >= maxSeconds) {
          handleFinishSession();
      }
  }, [counterSeconds, counterMethod, counterStatus]);

  const handleStartSession = (method: CountMethod) => {
      setCounterMethod(method);
      setCounterStatus('active');
      setCounterStartTime(Date.now());
      setCounterSeconds(0);
      setCounterValid(0);
      setCounterRaw(0);
      setLastClickTime(0);
  };

  const handleKickInteraction = () => {
      if (counterStatus !== 'active') return;
      if (navigator.vibrate) navigator.vibrate(50);

      const now = Date.now();
      setCounterRaw(prev => prev + 1);
      
      // Medical 5-min logic
      const fiveMinutes = 5 * 60 * 1000;
      
      // Only increment valid count if it's the first kick OR 5 minutes have passed since the LAST VALID KICK episode started.
      if (lastClickTime === 0 || (now - lastClickTime > fiveMinutes)) {
          setCounterValid(prev => prev + 1);
          setLastClickTime(now); // Only update the reference time when we start a new valid episode
      }
  };

  const handleFinishSession = async () => {
      setCounterStatus('summary');
      const endTime = Date.now();
      const duration = Math.floor((endTime - (counterStartTime || endTime)) / 1000);
      const sessionId = Date.now().toString() + Math.random().toString(36).substring(2);
      
      const session: KickSession = {
          id: sessionId,
          startTime: counterStartTime || Date.now(),
          endTime,
          durationSeconds: duration,
          count: counterValid,
          rawCount: counterRaw,
          method: counterMethod,
          weekOfPregnancy: weeks,
          anomalyStatus: 'none' // Default
      };

      setFinishedSession(session);
      
      // Analyze in background
      analyzeKickAnomaly(session, history, lang).then(analysis => {
        // Update the session state with analysis results
        const updatedSession = { 
          ...session, 
          anomalyStatus: analysis.severity, 
          anomalyReason: analysis.message 
        };
        
        setFinishedSession(updatedSession);

        // Also update history if this session was already saved
        setHistory(currentHistory => 
          currentHistory.map(s => s.id === sessionId ? updatedSession : s)
        );
      });
  };

  const resetCounterState = () => {
    setCounterStatus('idle');
    setFinishedSession(null);
    setCounterSeconds(0);
    setCounterStartTime(0);
    setCounterValid(0);
    setCounterRaw(0);
  };

  const handleSaveSession = () => {
      if (finishedSession) {
          // Check if already in history to avoid duplicates (from background update race condition)
          setHistory(prev => {
             if (prev.some(s => s.id === finishedSession.id)) return prev;
             return [...prev, finishedSession];
          });
      }
      resetCounterState();
      setActiveTab(TabView.DASHBOARD);
  };
  
  const handleCancelSession = () => {
      resetCounterState();
      setActiveTab(TabView.DASHBOARD);
  };


  // --- UI Handlers ---
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  if (!isInitialized) return null; 

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 shadow-2xl relative h-screen flex flex-col overflow-hidden">
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            {/* Dashboard */}
            <div className={`h-full w-full overflow-y-auto custom-scrollbar ${activeTab === TabView.DASHBOARD ? 'block' : 'hidden'}`}>
              <Dashboard 
                profile={profile} 
                sessions={history} 
                currentWeeks={weeks}
                currentDays={days}
                weeklyInsight={weeklyInsight}
                onChangeTab={setActiveTab}
                
                // Counter Props
                counterStatus={counterStatus}
                counterSeconds={counterSeconds}
                counterValid={counterValid}
                counterRaw={counterRaw}
                counterMethod={counterMethod}
                onStartSession={() => setActiveTab(TabView.COUNTER)}
                onKick={handleKickInteraction}
                onViewResults={() => setActiveTab(TabView.COUNTER)}
              />
            </div>

            {/* Trends */}
            <div className={`h-full w-full overflow-y-auto custom-scrollbar ${activeTab === TabView.TRENDS ? 'block' : 'hidden'}`}>
              <Trends history={history} language={lang} />
            </div>

            {/* Guide */}
            <div className={`h-full w-full overflow-y-auto custom-scrollbar ${activeTab === TabView.GUIDE ? 'block' : 'hidden'}`}>
              <WeeklyGuide 
                  week={weeks} 
                  language={lang} 
                  timezone={profile.timezone}
                  insight={weeklyInsight}
                  isLoading={isFetchingInsight}
              />
            </div>
            
            {/* Profile */}
            <div className={`h-full w-full overflow-y-auto custom-scrollbar ${activeTab === TabView.PROFILE ? 'block' : 'hidden'}`}>
              <Profile 
                profile={profile}
                onUpdate={setProfile}
              />
            </div>

            {/* Counter */}
            <div className={`h-full w-full bg-white ${activeTab === TabView.COUNTER ? 'block' : 'hidden'}`}>
              <KickCounter 
                week={weeks}
                history={history}
                language={lang}
                
                // Controlled Props
                status={counterStatus}
                method={counterMethod}
                seconds={counterSeconds}
                validCount={counterValid}
                rawCount={counterRaw}
                finishedSession={finishedSession}
                
                // Actions
                onSetMethod={setCounterMethod}
                onStart={handleStartSession}
                onKick={handleKickInteraction}
                onFinish={handleFinishSession}
                onSave={handleSaveSession}
                onCancel={handleCancelSession}
              />
            </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-50 shrink-0 safe-area-pb">
          <button 
            onClick={() => setActiveTab(TabView.DASHBOARD)}
            className={`flex flex-col items-center gap-1 transition-colors min-w-[3rem] ${activeTab === TabView.DASHBOARD ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{t.home}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(TabView.TRENDS)}
            className={`flex flex-col items-center gap-1 transition-colors min-w-[3rem] ${activeTab === TabView.TRENDS ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{t.trends}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(TabView.COUNTER)}
            className={`flex flex-col items-center gap-1 transition-colors min-w-[3rem] ${activeTab === TabView.COUNTER ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <div className={`rounded-full p-3 -mt-8 shadow-xl border-4 border-slate-50 transform transition active:scale-95 ${activeTab === TabView.COUNTER || counterStatus === 'active' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gray-800 hover:bg-gray-900'}`}>
              {counterStatus === 'active' ? <span className="text-white font-bold text-xs animate-pulse">{counterValid}</span> : <Activity className="w-6 h-6 text-white" />}
            </div>
            <span className="text-[10px] font-bold uppercase">{counterStatus === 'active' ? t.count : t.count}</span>
          </button>

          <button 
            onClick={() => setActiveTab(TabView.GUIDE)}
            className={`flex flex-col items-center gap-1 transition-colors min-w-[3rem] ${activeTab === TabView.GUIDE ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{t.guide}</span>
          </button>

          <button 
            onClick={() => setActiveTab(TabView.PROFILE)}
            className={`flex flex-col items-center gap-1 transition-colors min-w-[3rem] ${activeTab === TabView.PROFILE ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{t.me}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;