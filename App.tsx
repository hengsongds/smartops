import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings, 
  BarChart2, 
  FileText, 
  Menu,
  Globe,
  LayoutDashboard,
  Terminal,
  Plus,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { ChatView } from './components/ChatView';
import { ConfigView } from './components/ConfigView';
import { SettingsView } from './components/SettingsView';
import { MonitorView } from './components/MonitorView';
import { LogsView } from './components/LogsView';
import { OpsConfig, ConfigType, Language, Theme, ExecutionLog, ChatSession, Message } from './types';

// Initial Mock Data
const INITIAL_CONFIGS: OpsConfig[] = [
  // --- New RMS API Config (Added via Request) ---
  {
    id: 'api-rms-describe-hosts',
    name: '查询宿主机列表 (RMS DescribeHosts)',
    description: '查询 RMS 系统中的物理机/宿主机列表信息 (Stack Malaysia 环境)。',
    type: ConfigType.API,
    method: 'POST',
    content: JSON.stringify({
      url: "http://api.rms.stack-malaysia-1.stack-malaysia.local/rms-api-server?Action=DescribeHosts",
      headers: {
        "Accept": "application/json",
        "Request-Id": "req-dylkfqsabb",
        "User-Agent": "JvirtClient",
        "Content-Type": "application/json"
      },
      body: {
        "pool_name": "",
        "az": "",
        "data_center": "",
        "rack": "",
        "machine": "",
        "tag": "",
        "service_type": "",
        "host_group_id": 0,
        "service_code": "",
        "group_type": "",
        "host_meta": null,
        "host_ips": null,
        "page": null,
        "cluster_id": "",
        "data_ips": null,
        "scene": ""
      }
    }, null, 2),
    tags: ['Compute', 'Resource', 'System'],
    lastUpdated: '2025-12-03'
  },

  // --- New Environment Variables for OpenAPI ---
  {
    id: 'env-jdcloud-host',
    name: 'JDCLOUD_VM_HOST',
    description: '云主机 OpenApi 域名',
    type: ConfigType.ENV,
    content: 'vm.jdcloud-api.com',
    tags: ['System', 'Environment'],
    lastUpdated: '2025-12-02'
  },
  {
    id: 'env-jdcloud-region',
    name: 'JDCLOUD_REGION_ID',
    description: '默认区域 ID (Region ID)',
    type: ConfigType.ENV,
    content: 'cn-north-1',
    tags: ['Environment'],
    lastUpdated: '2025-12-02'
  },
  
  // --- Existing Configs ---
  {
    id: '1',
    name: 'SmartOps 平台系统信息',
    description: '获取 SmartOps 平台自身的系统信息和状态。',
    type: ConfigType.API,
    content: 'http://localhost:8081/api/v1/system/info',
    method: 'GET',
    tags: ['Compute'],
    lastUpdated: '2023-10-24'
  },
  {
    id: '2',
    name: '用户管理接口',
    description: '获取系统用户列表。',
    type: ConfigType.API,
    content: 'http://localhost:8081/api/v1/users',
    method: 'GET',
    tags: ['User Management'],
    lastUpdated: '2023-11-02'
  },
  {
    id: '3',
    name: '服务器状态检查',
    description: '检查主服务器的健康状态和运行指标。',
    type: ConfigType.API,
    content: 'http://localhost:8081/api/v1/server/status',
    method: 'GET',
    tags: ['Monitor'],
    lastUpdated: '2023-10-25'
  },
  {
    id: '4',
    name: '系统重启脚本',
    description: '安全重启系统服务。',
    type: ConfigType.SCRIPT,
    content: '#!/bin/bash\nsystemctl restart smartops-core\necho "Services restarted"',
    tags: ['Ops'],
    lastUpdated: '2023-09-15'
  },
  {
    id: '5',
    name: '数据库备份脚本',
    description: '执行主数据库的全量备份。',
    type: ConfigType.SCRIPT,
    content: 'pg_dump -U admin smart_db > /backup/db_$(date +%F).sql',
    tags: ['Data Management'],
    lastUpdated: '2023-10-01'
  },
   {
    id: '6',
    name: '应用部署脚本',
    description: '主应用程序的自动化部署流程。',
    type: ConfigType.SCRIPT,
    content: './deploy.sh --env=production',
    tags: ['Deployment'],
    lastUpdated: '2023-11-10'
  },
  {
    id: 'env-2',
    name: 'az',
    description: 'Availability Zone',
    type: ConfigType.ENV,
    content: 'cn-north-1a',
    tags: ['System', 'Environment'],
    lastUpdated: '2023-11-01'
  }
];

type View = 'CHAT' | 'CONFIG' | 'MONITOR' | 'LOGS' | 'SETTINGS';

const translations = {
  en: {
    smartChat: "Say Something",
    configCenter: "Configuration",
    monitoring: "Monitoring",
    logs: "Logs",
    systemSettings: "Settings",
    monitorPlaceholder: "Monitoring Dashboard Placeholder",
    logPlaceholder: "Logs System Placeholder",
    newChat: "New Chat",
    historyLimit: "Only recent 5 sessions kept"
  },
  zh: {
    smartChat: "说些什么",
    configCenter: "配置中心",
    monitoring: "监控大盘",
    logs: "日志查询",
    systemSettings: "系统设置",
    monitorPlaceholder: "监控大盘功能开发中",
    logPlaceholder: "日志系统功能开发中",
    newChat: "新建会话",
    historyLimit: "仅支持最近5份会话记录"
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('CHAT');
  const [configs, setConfigs] = useState<OpsConfig[]>(INITIAL_CONFIGS);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [language, setLanguage] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appTitle, setAppTitle] = useState('Optimus');
  const [appLogo, setAppLogo] = useState<string>('https://jdcloud-portal.oss.cn-north-1.jcloudcs.com/www.jcloud.com/12968f00-b6ef-4d07-bbcf-d4aec5b0d93820220520194921.png');
  
  // New State for customizable Chat Module Name (Support Bilingual)
  const [customChatTitles, setCustomChatTitles] = useState<{en: string; zh: string}>({
    en: '',
    zh: ''
  });

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'New Session',
      messages: [],
      lastUpdated: Date.now()
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default');
  const [chatHistoryOpen, setChatHistoryOpen] = useState(true);

  const t = translations[language];

  // Helper to get active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  
  // Compute display title: 
  // Strictly use current language config or system default.
  // Previous fallback logic caused confusion where one language title would persist to another.
  const displayChatTitle = customChatTitles[language] || t.smartChat;

  const handleAddConfig = (newConfig: OpsConfig) => {
    setConfigs([...configs, newConfig]);
  };

  const handleUpdateConfig = (updatedConfig: OpsConfig) => {
    setConfigs(configs.map(c => c.id === updatedConfig.id ? updatedConfig : c));
  };

  const handleDeleteConfig = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
  };

  const handleAddLog = (log: ExecutionLog) => {
    setLogs(prev => [log, ...prev]);
  };

  // Session Management
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: language === 'zh' ? '新会话' : 'New Session',
      messages: [],
      lastUpdated: Date.now()
    };
    
    setSessions(prev => {
      // Keep only top 4 + new one = 5
      const sorted = [...prev].sort((a, b) => b.lastUpdated - a.lastUpdated);
      const kept = sorted.slice(0, 4); 
      return [newSession, ...kept];
    });
    setActiveSessionId(newSession.id);
  };

  const handleSessionUpdate = (messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        // Derive title from first user message if title is default
        let title = s.title;
        if ((s.title === 'New Session' || s.title === '新会话') && messages.length > 1) {
             const firstUserMsg = messages.find(m => m.role === 'user');
             if (firstUserMsg) {
                 title = firstUserMsg.content.slice(0, 15) + (firstUserMsg.content.length > 15 ? '...' : '');
             }
        }
        return { ...s, messages, title, lastUpdated: Date.now() };
      }
      return s;
    }));
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      if (remaining.length === 0) {
        // Create default session if all deleted
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: language === 'zh' ? '新会话' : 'New Session',
            messages: [],
            lastUpdated: Date.now()
        };
        setActiveSessionId(newSession.id);
        return [newSession];
      }
      
      if (sessionId === activeSessionId) {
          // Switch to first available
          // Since render uses sort, we might want to respect that logic or just take first. 
          // Taking first from filtered is safe enough for this purpose.
          setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'CHAT':
        return <ChatView 
                  key={activeSessionId} // Force re-render on session switch
                  sessionId={activeSessionId}
                  initialMessages={activeSession.messages}
                  onSessionUpdate={handleSessionUpdate}
                  configs={configs} 
                  language={language} 
                  onLogExecute={handleAddLog} 
               />;
      case 'CONFIG':
        return <ConfigView 
            configs={configs} 
            onAddConfig={handleAddConfig} 
            onUpdateConfig={handleUpdateConfig}
            onDeleteConfig={handleDeleteConfig} 
            language={language} 
        />;
      case 'SETTINGS':
        return <SettingsView 
            language={language} 
            theme={theme} 
            onThemeChange={setTheme} 
            appTitle={appTitle}
            onAppTitleChange={setAppTitle}
            appLogo={appLogo}
            onAppLogoChange={setAppLogo}
            customChatTitles={customChatTitles}
            onCustomChatTitlesChange={setCustomChatTitles}
        />;
      case 'MONITOR':
        return <MonitorView logs={logs} language={language} />;
      case 'LOGS':
        return <LogsView logs={logs} language={language} />;
      default:
        return <ChatView 
                  key={activeSessionId}
                  sessionId={activeSessionId}
                  initialMessages={activeSession.messages}
                  onSessionUpdate={handleSessionUpdate}
                  configs={configs} 
                  language={language} 
                  onLogExecute={handleAddLog} 
               />;
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className={theme}>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
        
        {/* Standard Sidebar - Updated width to auto-adapt (w-fit) instead of fixed w-64 */}
        <aside className={`${sidebarOpen ? 'w-fit min-w-[220px]' : 'w-20'} bg-[#1a1a1a] text-[#a3a3a3] transition-all duration-300 flex flex-col flex-shrink-0 shadow-xl z-20`}>
             <div className={`h-16 flex items-center border-b border-[#333333] ${sidebarOpen ? 'px-6' : 'justify-center'}`}>
                <div className="flex items-center gap-3 font-bold text-white text-lg overflow-hidden whitespace-nowrap">
                    {appLogo ? (
                        <img src={appLogo} alt="Logo" className="w-8 h-8 rounded object-contain flex-shrink-0 bg-transparent" />
                    ) : (
                        <Terminal className="text-blue-500 flex-shrink-0" />
                    )}
                    <span className={`${!sidebarOpen && 'hidden'}`}>{appTitle}</span>
                </div>
             </div>
             
             <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                 <div className="mb-2">
                    <NavItem 
                        icon={<MessageSquare size={20} />} 
                        label={displayChatTitle} 
                        active={currentView === 'CHAT'} 
                        onClick={() => {
                            if (currentView === 'CHAT') {
                                setChatHistoryOpen(!chatHistoryOpen);
                            } else {
                                setCurrentView('CHAT');
                                setChatHistoryOpen(true);
                            }
                        }} 
                        expanded={sidebarOpen}
                        rightIcon={sidebarOpen && currentView === 'CHAT' ? (chatHistoryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                    />
                    
                    {/* Session List Sub-menu */}
                    {currentView === 'CHAT' && sidebarOpen && chatHistoryOpen && (
                        <div className="mt-2 ml-2 pl-3 border-l border-[#333333] space-y-2 animate-fade-in">
                            <div className="text-[10px] text-[#555] font-medium px-2 py-1 uppercase tracking-wider mb-1 flex items-center gap-1">
                                {t.historyLimit}
                            </div>
                            
                            {/* New Chat Button */}
                            <button 
                                onClick={handleNewSession}
                                className="w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm text-blue-400 hover:text-white hover:bg-blue-600/20 transition-colors group"
                            >
                                <Plus size={14} className="group-hover:scale-110 transition-transform"/>
                                {t.newChat}
                            </button>

                            {/* Session List */}
                            {sessions.sort((a,b) => b.lastUpdated - a.lastUpdated).map(session => (
                                <div key={session.id} className="group relative">
                                    <button
                                        onClick={() => setActiveSessionId(session.id)}
                                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors truncate pr-8
                                            ${activeSessionId === session.id 
                                                ? 'bg-[#333333] text-white' 
                                                : 'text-[#888] hover:text-[#ccc] hover:bg-[#252525]'
                                            }`}
                                        title={session.title}
                                    >
                                        <MessageCircle size={14} className="flex-shrink-0" />
                                        <span className="truncate">{session.title}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-[#333333]"
                                        title={language === 'zh' ? "删除会话" : "Delete Session"}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>

                 <NavItem 
                    icon={<LayoutDashboard size={20} />} 
                    label={t.configCenter} 
                    active={currentView === 'CONFIG'} 
                    onClick={() => setCurrentView('CONFIG')} 
                    expanded={sidebarOpen}
                 />
                 <NavItem 
                    icon={<BarChart2 size={20} />} 
                    label={t.monitoring} 
                    active={currentView === 'MONITOR'} 
                    onClick={() => setCurrentView('MONITOR')} 
                    expanded={sidebarOpen}
                 />
                 <NavItem 
                    icon={<FileText size={20} />} 
                    label={t.logs} 
                    active={currentView === 'LOGS'} 
                    onClick={() => setCurrentView('LOGS')} 
                    expanded={sidebarOpen}
                 />
                 
                 <div className="pt-6 mt-6 border-t border-[#333333]">
                    <NavItem 
                        icon={<Settings size={20} />} 
                        label={t.systemSettings} 
                        active={currentView === 'SETTINGS'} 
                        onClick={() => setCurrentView('SETTINGS')} 
                        expanded={sidebarOpen}
                    />
                 </div>
             </nav>

             <div className="p-4 border-t border-[#333333]">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded hover:bg-[#333333] transition-colors">
                    <Menu size={20} />
                </button>
             </div>
        </aside>

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header */}
          <header className="h-16 bg-white dark:bg-[#1e1e1e] shadow-sm border-b border-gray-200 dark:border-[#333333] flex items-center justify-between px-6 flex-shrink-0 z-10">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize flex items-center gap-2">
                {currentView === 'CHAT' ? (
                     <>
                        <span>{displayChatTitle}</span>
                        <span className="text-gray-400 text-sm font-normal">/ {activeSession.title}</span>
                     </>
                ) : (
                    currentView.toLowerCase().replace('_', ' ')
                )}
            </h1>

            <div className="flex items-center gap-4">
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#333333] hover:bg-gray-200 dark:hover:bg-[#404040] transition-colors text-sm font-medium"
                >
                  <Globe size={16} />
                  <span>{language === 'en' ? 'English' : '中文'}</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    A
                </div>
            </div>
          </header>

          {/* Viewport */}
          <main className="flex-1 overflow-hidden relative p-6">
              <div className="h-full bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm border border-gray-200 dark:border-[#333333] overflow-hidden">
                  {renderContent()}
              </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; expanded: boolean; rightIcon?: React.ReactNode }> = ({ icon, label, active, onClick, expanded, rightIcon }) => (
  <button 
    onClick={onClick}
    title={label}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 whitespace-nowrap overflow-hidden
      ${active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-[#a3a3a3] hover:bg-[#333333] hover:text-white'
      } ${!expanded ? 'justify-center' : ''}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {expanded && (
        <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="font-medium truncate">{label}</span>
            {rightIcon && <span className="ml-2 flex-shrink-0 opacity-75">{rightIcon}</span>}
        </div>
    )}
  </button>
);