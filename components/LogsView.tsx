import React, { useState } from 'react';
import { ExecutionLog, Language, LogSubscription, LogStorageType, ConfigType } from '../types';
import { Search, Filter, Settings, Plus, HardDrive, Cloud, Database, Trash2, Edit2, CheckCircle, XCircle, Save, X, FileText } from 'lucide-react';

interface LogsViewProps {
  logs: ExecutionLog[];
  language: Language;
}

const translations = {
  en: {
    title: "Log Management",
    tabQuery: "Log Query",
    tabSub: "Log Subscription",
    searchPlaceholder: "Search logs by name, summary or ID...",
    status: "Status",
    type: "Type",
    time: "Time",
    duration: "Duration",
    noLogs: "No logs found matching your criteria.",
    addSub: "Add Subscription",
    subName: "Subscription Name",
    storageType: "Storage Type",
    localPath: "Directory Path",
    s3Bucket: "S3 Bucket",
    s3Region: "Region",
    esEndpoint: "ES Endpoint",
    esIndex: "Index Name",
    accessKey: "Access Key",
    secretKey: "Secret Key",
    save: "Save Configuration",
    cancel: "Cancel",
    active: "Active",
    inactive: "Inactive",
    lastSync: "Last Sync",
    localDesc: "Store logs in local server directory",
    s3Desc: "Archive logs to AWS S3 or compatible object storage",
    esDesc: "Stream logs to Elasticsearch / Opensearch",
    actions: "Actions",
    config: "Configuration",
    path: "Path"
  },
  zh: {
    title: "日志管理",
    tabQuery: "日志查询",
    tabSub: "日志订阅配置",
    searchPlaceholder: "搜索日志名称、摘要或ID...",
    status: "状态",
    type: "类型",
    time: "时间",
    duration: "耗时",
    noLogs: "未找到匹配的日志记录。",
    addSub: "新建订阅",
    subName: "订阅名称",
    storageType: "存储类型",
    localPath: "本地目录路径",
    s3Bucket: "S3 存储桶 (Bucket)",
    s3Region: "区域 (Region)",
    esEndpoint: "ES 地址 (Endpoint)",
    esIndex: "索引名称 (Index)",
    accessKey: "Access Key",
    secretKey: "Secret Key",
    save: "保存配置",
    cancel: "取消",
    active: "运行中",
    inactive: "已停止",
    lastSync: "最近同步",
    localDesc: "将日志存储在服务器本地文件系统中",
    s3Desc: "归档日志到 AWS S3 或兼容的对象存储",
    esDesc: "实时流式传输日志到 Elasticsearch",
    actions: "操作",
    config: "配置详情",
    path: "路径"
  }
};

const MOCK_SUBSCRIPTIONS: LogSubscription[] = [
  {
    id: '1',
    name: 'Local Archive',
    type: LogStorageType.LOCAL,
    status: 'ACTIVE',
    lastSync: '2023-12-01 10:00:00',
    config: {
      path: '/var/log/smartops/archive'
    }
  },
  {
    id: '2',
    name: 'Ops Team ES',
    type: LogStorageType.ELASTICSEARCH,
    status: 'INACTIVE',
    lastSync: '2023-11-28 15:30:00',
    config: {
      endpoint: 'http://es-cluster.internal:9200',
      index: 'smartops-audit-v1'
    }
  }
];

export const LogsView: React.FC<LogsViewProps> = ({ logs, language }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'QUERY' | 'SUBSCRIPTION'>('QUERY');
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState<LogSubscription[]>(MOCK_SUBSCRIPTIONS);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LogSubscription>>({
    type: LogStorageType.LOCAL,
    status: 'ACTIVE',
    config: {}
  });

  // Filter Logs
  const filteredLogs = logs.filter(log => 
    log.configName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resultSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.id.includes(searchQuery)
  );

  const handleOpenModal = (sub?: LogSubscription) => {
    if (sub) {
      setEditingId(sub.id);
      setFormData(JSON.parse(JSON.stringify(sub))); // Deep copy
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        type: LogStorageType.LOCAL,
        status: 'ACTIVE',
        config: { path: '', bucket: '', region: '', endpoint: '', index: '' }
      });
    }
    setShowModal(true);
  };

  const handleSaveSubscription = () => {
    if (!formData.name) return;

    const newSub: LogSubscription = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      type: formData.type || LogStorageType.LOCAL,
      status: formData.status || 'ACTIVE',
      lastSync: editingId ? (formData.lastSync || new Date().toISOString()) : '-',
      config: formData.config || {}
    };

    if (editingId) {
      setSubscriptions(prev => prev.map(s => s.id === editingId ? newSub : s));
    } else {
      setSubscriptions(prev => [...prev, newSub]);
    }
    setShowModal(false);
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const renderConfigInputs = () => {
    switch (formData.type) {
      case LogStorageType.LOCAL:
        return (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.localPath}</label>
            <input 
              type="text"
              value={formData.config?.path || ''}
              onChange={e => setFormData({ ...formData, config: { ...formData.config, path: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
              placeholder="/var/log/data"
            />
          </div>
        );
      case LogStorageType.S3:
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.s3Bucket}</label>
                  <input 
                    type="text"
                    value={formData.config?.bucket || ''}
                    onChange={e => setFormData({ ...formData, config: { ...formData.config, bucket: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.s3Region}</label>
                  <input 
                    type="text"
                    value={formData.config?.region || ''}
                    onChange={e => setFormData({ ...formData, config: { ...formData.config, region: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] text-sm"
                  />
                </div>
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.accessKey}</label>
                <input 
                  type="password"
                  value={formData.config?.accessKey || ''}
                  onChange={e => setFormData({ ...formData, config: { ...formData.config, accessKey: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] text-sm"
                />
             </div>
          </div>
        );
      case LogStorageType.ELASTICSEARCH:
        return (
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.esEndpoint}</label>
                <input 
                  type="text"
                  value={formData.config?.endpoint || ''}
                  onChange={e => setFormData({ ...formData, config: { ...formData.config, endpoint: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] text-sm"
                  placeholder="http://localhost:9200"
                />
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.esIndex}</label>
                <input 
                  type="text"
                  value={formData.config?.index || ''}
                  onChange={e => setFormData({ ...formData, config: { ...formData.config, index: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] text-sm"
                  placeholder="smartops-logs"
                />
             </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#121212]">
      {/* Header Tabs */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333333] flex-shrink-0">
          <div className="px-6 py-4">
             <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight mb-4">{t.title}</h2>
             <div className="flex space-x-6">
                <button
                    onClick={() => setActiveTab('QUERY')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'QUERY'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Search size={16} /> {t.tabQuery}
                </button>
                <button
                    onClick={() => setActiveTab('SUBSCRIPTION')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'SUBSCRIPTION'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Settings size={16} /> {t.tabSub}
                </button>
             </div>
          </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
         
         {/* QUERY VIEW */}
         {activeTab === 'QUERY' && (
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                    <button className="px-4 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333333] rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors flex items-center gap-2 text-sm">
                        <Filter size={16} /> Filter
                    </button>
                </div>

                {/* Logs Table */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#333333]">
                             <tr>
                                <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.time}</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.type}</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 w-1/4">Name</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.duration}</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400 w-1/3">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {t.noLogs}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors">
                                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                                            {log.timestamp.replace('T', ' ').slice(0, 19)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                log.type === ConfigType.API 
                                                ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-400' 
                                                : log.type === ConfigType.ENV
                                                    ? 'bg-green-50 border-green-100 text-green-600 dark:bg-green-900/20 dark:border-green-900 dark:text-green-400'
                                                    : 'bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-900/20 dark:border-purple-900 dark:text-purple-400'
                                            }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                            {log.configName}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                                                log.status === 'SUCCESS' 
                                                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                            {log.durationMs}ms
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400 truncate max-w-xs" title={log.resultSummary}>
                                            {log.resultSummary}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         )}

         {/* SUBSCRIPTION VIEW */}
         {activeTab === 'SUBSCRIPTION' && (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {subscriptions.length} destinations configured
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
                    >
                        <Plus size={18} /> {t.addSub}
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {subscriptions.map(sub => (
                         <div key={sub.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#333333] p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                             <div className="flex justify-between items-start mb-4">
                                 <div className={`p-3 rounded-lg ${
                                     sub.type === LogStorageType.LOCAL ? 'bg-gray-100 text-gray-600 dark:bg-[#333333] dark:text-gray-300' :
                                     sub.type === LogStorageType.S3 ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                     'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                 }`}>
                                     {sub.type === LogStorageType.LOCAL && <HardDrive size={24} />}
                                     {sub.type === LogStorageType.S3 && <Cloud size={24} />}
                                     {sub.type === LogStorageType.ELASTICSEARCH && <Database size={24} />}
                                 </div>
                                 <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                     sub.status === 'ACTIVE' 
                                     ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                                     : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-[#333333] dark:border-[#404040] dark:text-gray-400'
                                 }`}>
                                     {sub.status === 'ACTIVE' ? t.active : t.inactive}
                                 </div>
                             </div>
                             
                             <h3 className="font-bold text-gray-900 dark:text-white mb-1">{sub.name}</h3>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 h-8">
                                {sub.type === LogStorageType.LOCAL && sub.config.path}
                                {sub.type === LogStorageType.S3 && `s3://${sub.config.bucket} (${sub.config.region})`}
                                {sub.type === LogStorageType.ELASTICSEARCH && sub.config.endpoint}
                             </p>

                             <div className="pt-4 border-t border-gray-100 dark:border-[#333333] flex justify-between items-center text-xs text-gray-400">
                                 <span>{t.lastSync}: {sub.lastSync || '-'}</span>
                                 <div className="flex gap-2">
                                     <button onClick={() => handleOpenModal(sub)} className="hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={14} /></button>
                                     <button onClick={() => handleDeleteSubscription(sub.id)} className="hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {/* Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100 dark:border-[#333333]">
                <div className="p-5 border-b border-gray-100 dark:border-[#333333] bg-gray-50/50 dark:bg-[#2d2d2d] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingId ? (language === 'zh' ? '编辑订阅' : 'Edit Subscription') : t.addSub}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.subName}</label>
                        <input 
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.storageType}</label>
                            <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as LogStorageType, config: {}})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] outline-none text-sm"
                            >
                                <option value={LogStorageType.LOCAL}>Local Filesystem</option>
                                <option value={LogStorageType.S3}>AWS S3 / Compatible</option>
                                <option value={LogStorageType.ELASTICSEARCH}>Elasticsearch</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.status}</label>
                            <select 
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] outline-none text-sm"
                            >
                                <option value="ACTIVE">{t.active}</option>
                                <option value="INACTIVE">{t.inactive}</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#2d2d2d] p-4 rounded-lg border border-gray-100 dark:border-[#333333]">
                         <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-[#404040] pb-2 flex items-center gap-2">
                            <Settings size={14} /> {t.config}
                         </h4>
                         {renderConfigInputs()}
                         <p className="mt-3 text-[10px] text-gray-400">
                             {formData.type === LogStorageType.LOCAL && t.localDesc}
                             {formData.type === LogStorageType.S3 && t.s3Desc}
                             {formData.type === LogStorageType.ELASTICSEARCH && t.esDesc}
                         </p>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 dark:border-[#333333] bg-gray-50/50 dark:bg-[#2d2d2d] flex justify-end gap-3">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#333333] rounded-lg text-sm font-medium transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleSaveSubscription}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-all"
                    >
                        {t.save}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};