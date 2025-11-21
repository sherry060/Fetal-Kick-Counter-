
import React, { useState, useMemo } from 'react';
import { KickSession, TRANSLATIONS } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { Brain, TrendingUp, Clock } from 'lucide-react';

interface Props {
  history: KickSession[];
  language: 'en' | 'zh';
}

type TimeRange = '1w' | '3w' | '7w' | 'all';

const Trends: React.FC<Props> = ({ history, language }) => {
  const [range, setRange] = useState<TimeRange>('1w');
  const t = TRANSLATIONS[language];

  // --- 1. Line Chart Data (Daily Totals) ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let daysToSub = 7;
    if (range === '3w') daysToSub = 21;
    if (range === '7w') daysToSub = 49;
    if (range === 'all') daysToSub = 300;

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToSub);
    
    const grouped: Record<string, { date: string, count: number, dateObj: Date }> = {};
    
    history.forEach(session => {
      if (new Date(session.startTime) > cutoffDate) {
        const dateKey = format(new Date(session.startTime), 'MM/dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = { date: dateKey, count: 0, dateObj: new Date(session.startTime) };
        }
        grouped[dateKey].count += session.count;
      }
    });

    return Object.values(grouped).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [history, range]);

  // --- 2. Bar Chart Data (Active Hours) ---
  const hourlyData = useMemo(() => {
      const counts = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
      history.forEach(s => {
          const h = new Date(s.startTime).getHours();
          counts[h].count += s.count;
      });
      // Only keep range of hours with activity for better chart scaling? Or show all?
      // Show all 24h implies "distribution". 
      // To match design usually we show simplified 4, 8, 12, 16, 20 ticks.
      return counts;
  }, [history]);

  const averageKicks = filteredData.length > 0 
    ? Math.round(filteredData.reduce((acc, curr) => acc + curr.count, 0) / filteredData.length) 
    : 0;

  // --- AI Pattern Text ---
  const patternText = useMemo(() => {
     if (history.length < 3) return t.notEnoughData;
     
     const hours = history.map(h => new Date(h.startTime).getHours());
     const counts: Record<number, number> = {};
     let maxCount = 0;
     let peakHour = 0;
     hours.forEach(h => {
         counts[h] = (counts[h] || 0) + 1;
         if (counts[h] > maxCount) {
             maxCount = counts[h];
             peakHour = h;
         }
     });
     
     const timeStr = `${peakHour}:00 - ${peakHour + 1}:00`;
     
     if (language === 'zh') {
         return `根据过去记录，您的宝宝在 ${timeStr} 时段最为活跃。近期日均有效胎动约为 ${averageKicks} 次。整体活动趋势${filteredData.length > 1 ? '保持平稳' : '数据较少'}。`;
     } else {
         return `Based on history, your baby is most active around ${timeStr}. Recent daily average is ${averageKicks} movements. Trend appears ${filteredData.length > 1 ? 'stable' : 'limited'}.`;
     }
  }, [history, language, averageKicks, filteredData.length, t]);

  const ranges: {key: TimeRange, label: string}[] = [
      { key: '1w', label: t.w1 },
      { key: '3w', label: t.w3 },
      { key: '7w', label: t.w7 },
      { key: 'all', label: t.all },
  ];

  return (
    <div className="p-4 space-y-5 pb-32">
      
      {/* 1. AI Summary Card */}
      <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-indigo-100 p-1.5 rounded-full">
                <Brain className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="font-bold text-indigo-900 text-lg">{t.aiPatternSummary}</h2>
          </div>
          
          <p className="text-indigo-900 text-sm leading-relaxed mb-4 font-medium opacity-80">
               {patternText}
          </p>
          
          <div className="bg-white/60 rounded-lg p-3 border border-indigo-100 text-xs text-indigo-600 flex gap-2 items-start">
             <span className="font-bold shrink-0">{t.disclaimer}:</span> 
             <span className="opacity-80">{t.aiDisclaimer}</span>
          </div>
      </div>

      {/* 2. Trends Chart Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
           <TrendingUp className="w-5 h-5 text-rose-500" />
           <h2 className="font-bold text-gray-800 text-lg">{t.trends}</h2>
        </div>

        {/* Segmented Control Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  range === r.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {r.label}
              </button>
            ))}
        </div>

        <div className="h-56 w-full">
          {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                    dy={10}
                  />
                  <YAxis 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px'}}
                    itemStyle={{color: '#ec4899', fontWeight: 'bold'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#f472b6" 
                    strokeWidth={3} 
                    dot={{ fill: '#f472b6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
          ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm flex-col gap-2">
                  <TrendingUp className="w-8 h-8 opacity-20" />
                  <p>{t.notEnoughData}</p>
              </div>
          )}
        </div>
      </div>

      {/* 3. Active Hours Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
               <Clock className="w-5 h-5 text-rose-500" />
               <h2 className="font-bold text-gray-800 text-lg">{t.activeHours}</h2>
          </div>
          
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="hour" 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        tickLine={false} 
                        axisLine={false}
                        interval={3} // Show every 4th hour (0, 4, 8...)
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                        cursor={{fill: '#fce7f3'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px'}}
                    />
                    <Bar 
                        dataKey="count" 
                        fill="#fbcfe8" 
                        activeBar={{ fill: '#f472b6' }}
                        radius={[4, 4, 0, 0]} 
                    />
                </BarChart>
             </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Trends;
