
import React from 'react';
import { Language, WeeklyInsight, TRANSLATIONS } from '../types';
import { Stethoscope, ShoppingBag, Heart, Baby, Utensils, Sparkles } from 'lucide-react';

interface Props {
  week: number;
  language: Language;
  timezone: string;
  insight: WeeklyInsight | null;
  isLoading: boolean;
}

const WeeklyGuide: React.FC<Props> = ({ week, language, insight, isLoading }) => {
  const t = TRANSLATIONS[language];

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mb-4"></div>
        <p className="text-sm font-medium">{t.loadingAdvice}</p>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="p-4 space-y-6 pb-32">
      <div className="text-center mb-4">
        <div className="inline-block px-4 py-1 bg-rose-100 text-rose-500 rounded-full text-sm font-bold mb-2 shadow-sm">
           {language === 'zh' ? `孕 ${week} 周` : `Week ${week}`}
        </div>
        <h2 className="text-2xl font-bold text-slate-700">{t.guide}</h2>
      </div>

      {/* AI Disclaimer */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex gap-2 items-start">
        <Sparkles className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
            {t.aiDisclaimer}
        </p>
      </div>

      {/* Mom */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-rose-300">
        <div className="flex items-start gap-4 mb-2">
          <div className="bg-rose-50 p-3 rounded-full shrink-0">
             <Heart className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 text-lg">{t.mom}</h3>
            <div className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-line">
                {insight.momSymptoms}
            </div>
          </div>
        </div>
      </div>

      {/* Baby */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-orange-300">
        <div className="flex items-start gap-4 mb-2">
          <div className="bg-orange-50 p-3 rounded-full shrink-0">
             <Baby className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 text-lg">{t.baby}</h3>
            <div className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-line">
                {insight.babyDevelopment}
            </div>
          </div>
        </div>
      </div>

      {/* Medical */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-blue-400">
        <div className="flex items-start gap-4 mb-2">
          <div className="bg-blue-50 p-3 rounded-full shrink-0">
             <Stethoscope className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 text-lg">{t.medical}</h3>
            <div className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-line">
                {insight.medicalAdvice}
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-green-400">
        <div className="flex items-start gap-4 mb-2">
          <div className="bg-green-50 p-3 rounded-full shrink-0">
             <Utensils className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 text-lg">{t.nutrition}</h3>
            <div className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-line">
                {insight.nutrition}
            </div>
          </div>
        </div>
      </div>

      {/* Shopping */}
      {insight.shopping && insight.shopping !== "N/A" && (
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 shadow-sm border border-purple-100">
          <div className="flex items-start gap-4 mb-2">
            <div className="bg-white p-3 rounded-full shadow-sm shrink-0">
               <ShoppingBag className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-700 text-lg">{t.shopping}</h3>
              <div className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-line">
                {insight.shopping}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyGuide;