import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings, 
  BarChart2, 
  FileText, 
  Menu,
  Globe,
  LayoutDashboard,
  Terminal
} from 'lucide-react';
import { ChatView } from './components/ChatView';
import { ConfigView } from './components/ConfigView';
import { SettingsView } from './components/SettingsView';
import { MonitorView } from './components/MonitorView';
import { LogsView } from './components/LogsView';
import { OpsConfig, ConfigType, Language, Theme, ExecutionLog } from './types';

// Initial Mock Data
const INITIAL_CONFIGS: OpsConfig[] = [
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
    id: 'env-1',
    name: 'region',
    description: 'Default Region',
    type: ConfigType.ENV,
    content: 'stack-shanxi-1',
    tags: ['System', 'Environment'],
    lastUpdated: '2023-11-01'
  },
  {
    id: 'env-2',
    name: 'az',
    description: 'Availability Zone',
    type: ConfigType.ENV,
    content: 'stack-shanxi-1a',
    tags: ['System', 'Environment'],
    lastUpdated: '2023-11-01'
  },
  {
    id: 'env-3',
    name: 'ak',
    description: 'Access Key',
    type: ConfigType.ENV,
    content: 'dsadasdasd',
    tags: ['Security'],
    lastUpdated: '2023-11-01'
  },
  {
    id: 'env-4',
    name: 'sk',
    description: 'Secret Key',
    type: ConfigType.ENV,
    content: 'asfsweqweqe',
    tags: ['Security'],
    lastUpdated: '2023-11-01'
  },
  {
    id: 'env-5',
    name: 'apigw',
    description: 'API Gateway Endpoint',
    type: ConfigType.ENV,
    content: 'apigw.stack-shanxi-1a.local',
    tags: ['Network'],
    lastUpdated: '2023-11-01'
  }
];

type View = 'CHAT' | 'CONFIG' | 'MONITOR' | 'LOGS' | 'SETTINGS';

const translations = {
  en: {
    smartChat: "Chat & Operations",
    configCenter: "Configuration",
    monitoring: "Monitoring",
    logs: "Logs",
    systemSettings: "Settings",
    smartOps: "SmartOps Platform",
    monitorPlaceholder: "Monitoring Dashboard Placeholder",
    logPlaceholder: "Logs System Placeholder",
  },
  zh: {
    smartChat: "智能对话",
    configCenter: "配置中心",
    monitoring: "监控大盘",
    logs: "日志查询",
    systemSettings: "系统设置",
    smartOps: "智能运维平台",
    monitorPlaceholder: "监控大盘功能开发中",
    logPlaceholder: "日志系统功能开发中",
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('CHAT');
  const [configs, setConfigs] = useState<OpsConfig[]>(INITIAL_CONFIGS);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [language, setLanguage] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const t = translations[language];

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

  const renderContent = () => {
    switch (currentView) {
      case 'CHAT':
        return <ChatView configs={configs} language={language} onLogExecute={handleAddLog} />;
      case 'CONFIG':
        return <ConfigView 
            configs={configs} 
            onAddConfig={handleAddConfig} 
            onUpdateConfig={handleUpdateConfig}
            onDeleteConfig={handleDeleteConfig} 
            language={language} 
        />;
      case 'SETTINGS':
        return <SettingsView language={language} theme={theme} onThemeChange={setTheme} />;
      case 'MONITOR':
        return <MonitorView logs={logs} language={language} />;
      case 'LOGS':
        return <LogsView logs={logs} language={language} />;
      default:
        return <ChatView configs={configs} language={language} onLogExecute={handleAddLog} />;
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className={theme}>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
        
        {/* Standard Sidebar - Updated background to neutral gray-black */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1a1a1a] text-[#a3a3a3] transition-all duration-300 flex flex-col flex-shrink-0 shadow-xl z-20`}>
             <div className={`h-16 flex items-center border-b border-[#333333] ${sidebarOpen ? 'px-6' : 'justify-center'}`}>
                <div className="flex items-center gap-3 font-bold text-white text-lg overflow-hidden whitespace-nowrap">
                    <Terminal className="text-blue-500 flex-shrink-0" />
                    <span className={`${!sidebarOpen && 'hidden'}`}>SmartOps</span>
                </div>
             </div>
             
             <nav className="flex-1 py-6 px-3 space-y-1">
                 <NavItem 
                    icon={<MessageSquare size={20} />} 
                    label={t.smartChat} 
                    active={currentView === 'CHAT'} 
                    onClick={() => setCurrentView('CHAT')} 
                    expanded={sidebarOpen}
                 />
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
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
                {currentView.toLowerCase().replace('_', ' ')}
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

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; expanded: boolean }> = ({ icon, label, active, onClick, expanded }) => (
  <button 
    onClick={onClick}
    title={label}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200
      ${active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-[#a3a3a3] hover:bg-[#333333] hover:text-white'
      } ${!expanded ? 'justify-center' : ''}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {expanded && <span className="font-medium whitespace-nowrap overflow-hidden">{label}</span>}
  </button>
);