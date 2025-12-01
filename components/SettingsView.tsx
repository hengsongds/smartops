import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Language, Theme } from '../types';

interface SettingsViewProps {
  language: Language;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const translations = {
  en: {
    title: "System Settings",
    appearance: "Appearance",
    theme: "Theme Mode",
    light: "Light",
    dark: "Dark",
    lang: "Language",
    about: "About",
    version: "Version"
  },
  zh: {
    title: "系统设置",
    appearance: "外观设置",
    theme: "主题模式",
    light: "浅色",
    dark: "深色",
    lang: "语言设置",
    about: "关于",
    version: "当前版本"
  }
};

export const SettingsView: React.FC<SettingsViewProps> = ({ language, theme, onThemeChange }) => {
  const t = translations[language];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t.title}</h2>
      
      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2d2d2d]">
             <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
               <Monitor size={18} />
               {t.appearance}
             </h3>
          </div>
          <div className="p-6">
             <div className="flex items-center justify-between mb-4">
                <label className="text-gray-700 dark:text-gray-300 font-medium">{t.theme}</label>
                <div className="flex bg-gray-100 dark:bg-[#2d2d2d] rounded-lg p-1">
                   <button 
                      onClick={() => onThemeChange('light')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          theme === 'light' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                      }`}
                   >
                       <Sun size={16} /> {t.light}
                   </button>
                   <button 
                      onClick={() => onThemeChange('dark')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          theme === 'dark' 
                          ? 'bg-gray-600 text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                      }`}
                   >
                       <Moon size={16} /> {t.dark}
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2d2d2d]">
             <h3 className="font-semibold text-gray-800 dark:text-white">{t.about}</h3>
          </div>
          <div className="p-6">
              <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t.version}</span>
                  <span className="font-mono text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">v1.2.0-stable</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};