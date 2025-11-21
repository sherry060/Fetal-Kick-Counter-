
import React, { useState, useEffect } from 'react';
import { UserProfile, Language, TRANSLATIONS, TIMEZONES, AccountInfo } from '../types';
import { Calendar, Baby, Languages, Globe, UserCircle } from 'lucide-react';
import { mockGoogleLogin } from '../services/authService';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<'auth' | 'details'>('auth');
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [language, setLanguage] = useState<Language>('zh');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [account, setAccount] = useState<AccountInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (language === 'zh') setTimezone('Asia/Shanghai');
    if (language === 'en') setTimezone('America/Los_Angeles');
  }, [language]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const googleUser = await mockGoogleLogin();
      setAccount(googleUser);
      setName("Mommy"); // Auto-fill name from mock data
      setStep('details');
    } catch (e) {
      console.error("Login failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    setAccount({ id: 'guest_' + Date.now(), provider: 'guest' });
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && dueDate) {
      onComplete({ name, dueDate, language, timezone, account });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
        {/* Language Toggle */}
        <button 
            onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-600 flex items-center gap-1 text-xs font-bold"
        >
            <Languages className="w-4 h-4" />
            {language.toUpperCase()}
        </button>

        <div className="text-center mb-8">
          <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Baby className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t.welcome}</h1>
          <p className="text-gray-500 mt-2">{t.setupProfile}</p>
        </div>

        {step === 'auth' ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <p className="text-sm text-blue-800 text-center leading-relaxed">{t.loginDesc}</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg shadow-sm flex items-center justify-center gap-3 transition"
            >
              {isLoading ? (
                <span>{t.loggingIn}</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t.signInGoogle}
                </>
              )}
            </button>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-pink-50 px-2 text-gray-400">or</span>
                </div>
            </div>

            <button
              onClick={handleGuestMode}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg shadow-sm transition"
            >
              {t.guestMode}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">{t.guestDesc}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
             {/* User Info Display if Google */}
             {account?.provider === 'google' && (
                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg mb-4">
                    <img src={account.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full bg-white" />
                    <div className="text-sm">
                        <p className="font-bold text-gray-800">{t.signInGoogle}</p>
                        <p className="text-gray-500">{account.email}</p>
                    </div>
                </div>
             )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameLabel}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition"
                placeholder={t.namePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dateLabel}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.timezoneLabel}</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition bg-white"
                >
                  {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg shadow-lg transform transition active:scale-95 mt-2"
            >
              {t.startTracking}
            </button>
            <button 
                type="button" 
                onClick={() => setStep('auth')}
                className="w-full text-gray-400 text-sm py-2 hover:text-gray-600"
            >
                &larr; Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
