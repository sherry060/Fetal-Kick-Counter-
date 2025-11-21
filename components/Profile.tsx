
import React, { useState, useEffect } from 'react';
import { UserProfile, TIMEZONES, TRANSLATIONS, Language } from '../types';
import { Save, User, Calendar, Globe, Languages, Check, AlertTriangle, LogOut, LogIn, Cloud } from 'lucide-react';
import { mockGoogleLogin, mockLogout } from '../services/authService';

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => Promise<void>;
}

const Profile: React.FC<Props> = ({ profile, onUpdate }) => {
  const [name, setName] = useState(profile.name);
  const [dueDate, setDueDate] = useState(profile.dueDate);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [language, setLanguage] = useState<Language>(profile.language);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Sync local state if props change externally
  useEffect(() => {
    setName(profile.name);
    setDueDate(profile.dueDate);
    setTimezone(profile.timezone);
    setLanguage(profile.language);
  }, [profile]);

  const t = TRANSLATIONS[language];
  const isGuest = !profile.account || profile.account.provider === 'guest';

  const handleSave = async () => {
    await onUpdate({ ...profile, name, dueDate, timezone, language });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
        const account = await mockGoogleLogin();
        // onUpdate handles the sync logic in App.tsx
        await onUpdate({ ...profile, account });
    } catch (e) {
        console.error(e);
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    await mockLogout();
    // Revert to guest with unique timestamp to ensure clean slate
    await onUpdate({ 
        ...profile, 
        account: { id: 'guest', provider: 'guest' } 
    });
    setIsAuthLoading(false);
  };

  return (
    <div className="p-4 pb-32 space-y-6">
      
      {/* Account Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-rose-500" />
                  {t.account}
              </h2>
              {!isGuest && (
                  <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">
                      <Cloud className="w-3 h-3" />
                      {t.cloudBackup}
                  </div>
              )}
          </div>
          
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  {isGuest ? (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <User className="w-6 h-6" />
                      </div>
                  ) : (
                      <div className="relative">
                          <img src={profile.account?.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                  )}
                  <div>
                      <p className="font-bold text-gray-700">
                          {isGuest ? t.notLoggedIn : t.signInGoogle}
                      </p>
                      <p className="text-xs text-gray-500">
                          {isGuest ? t.guestBadge : profile.account?.email}
                      </p>
                      {!isGuest && <p className="text-[10px] text-gray-400 mt-0.5">{t.lastSync}</p>}
                  </div>
              </div>
              
              {isGuest ? (
                  <button 
                    onClick={handleLogin}
                    disabled={isAuthLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-full font-bold transition flex items-center gap-1 shadow-sm shadow-blue-200"
                  >
                      {isAuthLoading ? '...' : <LogIn className="w-3 h-3" />}
                      {t.syncNow}
                  </button>
              ) : (
                  <button 
                    onClick={handleLogout}
                    disabled={isAuthLoading}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-4 py-2 rounded-full font-bold transition flex items-center gap-1"
                  >
                      {isAuthLoading ? '...' : <LogOut className="w-3 h-3" />}
                      {t.logout}
                  </button>
              )}
          </div>
          
          {isGuest && (
              <div className="mt-4 bg-blue-50 p-3 rounded-xl text-xs text-blue-700 leading-relaxed">
                  {t.loginDesc}
              </div>
          )}
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t.profileSettings}</h2>
          {showSuccess && (
            <div className="flex items-center gap-1 text-green-600 text-sm font-bold animate-pulse">
                <Check className="w-4 h-4" />
                {t.saved}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameLabel}</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dateLabel}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Timezone */}
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

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.language}</label>
            <div className="relative">
              <Languages className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition bg-white"
              >
                <option value="zh">中文 (Chinese)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          
          {/* Warning */}
          <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-amber-700 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{t.dataChangeWarning}</p>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
          >
            <Save className="w-5 h-5" />
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
