import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Type, Upload, Link as LinkIcon, Terminal, Save, Check } from 'lucide-react';
import { Language, Theme } from '../types';

interface SettingsViewProps {
  language: Language;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  appTitle: string;
  onAppTitleChange: (title: string) => void;
  appLogo: string;
  onAppLogoChange: (logo: string) => void;
  customChatTitles: { en: string; zh: string };
  onCustomChatTitlesChange: (titles: { en: string; zh: string }) => void;
}

const translations = {
  en: {
    title: "System Settings",
    general: "Basic Settings",
    sysName: "System Name",
    sysNamePlaceholder: "e.g. SmartOps Platform",
    chatName: "Chat Module Name",
    chatNamePlaceholder: "Default: Say Something",
    logoLabel: "System Logo",
    logoUrl: "Image URL",
    logoUpload: "Upload Image",
    logoHelp: "Support URL or Local File (Max 2MB)",
    preview: "Preview",
    browse: "Browse",
    remove: "Remove Logo",
    appearance: "Appearance",
    theme: "Theme Mode",
    light: "Light",
    dark: "Dark",
    lang: "Language",
    about: "About",
    version: "Version",
    save: "Save Configuration",
    saved: "Saved!",
    unsaved: "Unsaved Changes",
    editingLang: "Editing for current language:",
    leaveEmpty: "Leave empty to use default localized name"
  },
  zh: {
    title: "系统设置",
    general: "基础设置",
    sysName: "系统名称",
    sysNamePlaceholder: "例如：SmartOps 智能运维平台",
    chatName: "对话模块名称",
    chatNamePlaceholder: "默认：说些什么",
    logoLabel: "系统 Logo",
    logoUrl: "图片链接",
    logoUpload: "上传图片",
    logoHelp: "支持网络链接或本地文件上传 (最大 2MB)",
    preview: "预览",
    browse: "选择文件",
    remove: "清除 Logo",
    appearance: "外观设置",
    theme: "主题模式",
    light: "浅色",
    dark: "深色",
    lang: "语言设置",
    about: "关于",
    version: "当前版本",
    save: "保存配置",
    saved: "已保存！",
    unsaved: "有未保存的更改",
    editingLang: "当前编辑语言：",
    leaveEmpty: "留空以使用默认多语言名称"
  }
};

export const SettingsView: React.FC<SettingsViewProps> = ({ language, theme, onThemeChange, appTitle, onAppTitleChange, appLogo, onAppLogoChange, customChatTitles, onCustomChatTitlesChange }) => {
  const t = translations[language];
  const [logoMode, setLogoMode] = useState<'URL' | 'FILE'>('URL');
  
  // Local state for form fields to support explicit saving
  const [localTitle, setLocalTitle] = useState(appTitle);
  const [localChatTitles, setLocalChatTitles] = useState(customChatTitles);
  const [localLogo, setLocalLogo] = useState(appLogo);
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state if props change externally
  useEffect(() => {
    setLocalTitle(appTitle);
    setLocalChatTitles(customChatTitles);
    setLocalLogo(appLogo);
  }, [appTitle, appLogo, customChatTitles]);

  const handleTitleChange = (val: string) => {
    setLocalTitle(val);
    setHasChanges(true);
    setIsSaved(false);
  };
  
  const handleChatTitleChange = (val: string) => {
    setLocalChatTitles({
        ...localChatTitles,
        [language]: val
    });
    setHasChanges(true);
    setIsSaved(false);
  };

  const handleLogoChange = (val: string) => {
    setLocalLogo(val);
    setHasChanges(true);
    setIsSaved(false);
  };

  const handleSave = () => {
      onAppTitleChange(localTitle);
      onCustomChatTitlesChange(localChatTitles);
      onAppLogoChange(localLogo);
      
      setHasChanges(false);
      setIsSaved(true);
      
      // Reset saved message after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Simple validation
        if (file.size > 2 * 1024 * 1024) {
            alert(language === 'zh' ? '文件过大，请上传小于 2MB 的图片' : 'File too large, please upload image smaller than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleLogoChange(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  // Simplified placeholder - removed fallback logic
  const dynamicPlaceholder = t.chatNamePlaceholder;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 overflow-y-auto h-full flex flex-col relative">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t.title}</h2>
      
      <div className="space-y-6 pb-20">
        
        {/* Basic Settings Section */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2d2d2d]">
             <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
               <Type size={18} />
               {t.general}
             </h3>
          </div>
          <div className="p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Name */}
                <div className="flex flex-col gap-2">
                    <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t.sysName}</label>
                    <div>
                        <input 
                            type="text"
                            value={localTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder={t.sysNamePlaceholder}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all"
                        />
                    </div>
                </div>
                
                {/* Chat Module Name */}
                <div className="flex flex-col gap-2">
                    <label className="text-gray-700 dark:text-gray-300 font-medium text-sm flex justify-between">
                        {t.chatName}
                        <span className="text-blue-500 font-normal text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                            {t.editingLang} {language === 'en' ? 'English' : '中文'}
                        </span>
                    </label>
                    <div>
                        <input 
                            type="text"
                            value={localChatTitles[language]}
                            onChange={(e) => handleChatTitleChange(e.target.value)}
                            placeholder={dynamicPlaceholder}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all"
                        />
                         <p className="text-[10px] text-gray-400 mt-1 ml-1">
                            {t.leaveEmpty}
                        </p>
                    </div>
                </div>
             </div>

             {/* System Logo */}
             <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-[#333333]">
                <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t.logoLabel}</label>
                
                <div className="flex gap-6 items-start">
                    {/* Preview Box */}
                    <div>
                        <div className="w-20 h-20 rounded-lg bg-[#1a1a1a] flex items-center justify-center border border-gray-300 dark:border-[#404040] overflow-hidden relative shadow-inner">
                            {localLogo ? (
                                <img src={localLogo} alt="Preview" className="w-12 h-12 object-contain" />
                            ) : (
                                <Terminal className="text-blue-500 w-8 h-8" />
                            )}
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2">{t.preview}</p>
                    </div>

                    <div className="flex-1 space-y-3 max-w-md">
                        {/* Mode Switcher */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setLogoMode('URL')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                                    logoMode === 'URL' 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                                    : 'bg-white border-gray-200 text-gray-600 dark:bg-[#2d2d2d] dark:border-[#404040] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#333333]'
                                }`}
                            >
                                <LinkIcon size={14} /> URL
                            </button>
                            <button 
                                onClick={() => setLogoMode('FILE')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                                    logoMode === 'FILE' 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                                    : 'bg-white border-gray-200 text-gray-600 dark:bg-[#2d2d2d] dark:border-[#404040] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#333333]'
                                }`}
                            >
                                <Upload size={14} /> Upload
                            </button>
                            {localLogo && (
                                <button 
                                    onClick={() => handleLogoChange('')}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 ml-auto transition-colors"
                                >
                                    {t.remove}
                                </button>
                            )}
                        </div>

                        {/* Inputs */}
                        {logoMode === 'URL' ? (
                            <input 
                                type="text" 
                                value={localLogo.startsWith('data:') ? '' : localLogo} 
                                onChange={(e) => handleLogoChange(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 dark:text-gray-200"
                            />
                        ) : (
                            <div className="relative border border-dashed border-gray-300 dark:border-[#404040] rounded-lg p-4 bg-gray-50 dark:bg-[#2d2d2d] hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="text-center">
                                    <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.logoUpload}</p>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-400">{t.logoHelp}</p>
                    </div>
                </div>
             </div>
          </div>
        </div>

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

      {/* Floating Save Button Area */}
      <div className="fixed bottom-6 right-8 z-50">
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                isSaved 
                ? 'bg-green-600 text-white cursor-default'
                : hasChanges
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-[#333333] text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
              {isSaved ? <Check size={20} /> : <Save size={20} />}
              {isSaved ? t.saved : t.save}
          </button>
      </div>

    </div>
  );
};