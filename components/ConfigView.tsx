import React, { useState, useMemo } from 'react';
import { OpsConfig, ConfigType, Language } from '../types';
import { Plus, Search, Trash2, Edit2, Play, Box, Tag, Database, Activity, Globe, Server, Terminal, Settings, LayoutGrid, LayoutList } from 'lucide-react';

interface ConfigViewProps {
  configs: OpsConfig[];
  onAddConfig: (config: OpsConfig) => void;
  onUpdateConfig: (config: OpsConfig) => void;
  onDeleteConfig: (id: string) => void;
  language: Language;
}

const translations = {
  en: {
    title: "Interface & Script Config Center",
    addConfig: "Add Config",
    searchPlaceholder: "Search...",
    tab_all: "All Configs",
    tab_api: "API Interfaces",
    tab_script: "Custom Scripts",
    tab_env: "Environment Variables",
    filter_label: "Tag Filter:",
    label_all: "All",
    btn_edit: "Edit",
    btn_delete: "Delete",
    name: "Name",
    key: "Key",
    desc: "Description",
    type: "Type",
    content: "Content / URL",
    value: "Value",
    method: "Method",
    tags: "Tags",
    actions: "Actions",
    save: "Save Configuration",
    cancel: "Cancel",
    noData: "No configurations matching current filter."
  },
  zh: {
    title: "接口与脚本配置中心",
    addConfig: "添加配置",
    searchPlaceholder: "搜索...",
    tab_all: "全部配置",
    tab_api: "API 接口",
    tab_script: "自定义脚本",
    tab_env: "环境变量",
    filter_label: "标签筛选：",
    label_all: "全部",
    btn_edit: "编辑",
    btn_delete: "删除",
    name: "配置名称",
    key: "配置键 (Key)",
    desc: "描述",
    type: "类型",
    content: "内容/URL",
    value: "配置值 (Value)",
    method: "请求方法",
    tags: "标签",
    actions: "操作",
    save: "保存配置",
    cancel: "取消",
    noData: "暂无匹配的配置数据。"
  }
};

const MOCK_TAGS = ['Data Management', 'User Management', 'Monitor', 'Network', 'Compute', 'Ops', 'Deployment', 'System', 'Security', 'Environment'];

const TAG_TRANSLATIONS: Record<string, string> = {
    'Data Management': '数据管理',
    'User Management': '用户管理',
    'Monitor': '监控',
    'Network': '网络',
    'Compute': '计算',
    'Ops': '运维操作',
    'Deployment': '部署',
    'System': '系统',
    'Security': '安全',
    'Environment': '环境'
};

export const ConfigView: React.FC<ConfigViewProps> = ({ configs, onAddConfig, onUpdateConfig, onDeleteConfig, language }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'ALL' | 'API' | 'SCRIPT' | 'ENV'>('API');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('GRID');
  const [showModal, setShowModal] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Omit<OpsConfig, 'tags'> & { tags: string | string[] }>>({
    type: ConfigType.API,
    name: '',
    description: '',
    content: '',
    method: 'GET',
    tags: []
  });

  const allTags = useMemo(() => {
     const dataTags = new Set<string>();
     configs.forEach(c => c.tags.forEach(tag => dataTags.add(tag)));
     MOCK_TAGS.forEach(tag => dataTags.add(tag));
     return Array.from(dataTags);
  }, [configs]);

  const filteredConfigs = configs.filter(c => {
    if (activeTab === 'API' && c.type !== ConfigType.API) return false;
    if (activeTab === 'SCRIPT' && c.type !== ConfigType.SCRIPT) return false;
    if (activeTab === 'ENV' && c.type !== ConfigType.ENV) return false;

    if (activeTag !== 'All') {
        const tagMatch = c.tags.some(t => 
             t.toLowerCase() === activeTag.toLowerCase() || 
             (TAG_TRANSLATIONS[t] && TAG_TRANSLATIONS[t] === activeTag)
        );
        const englishTag = Object.keys(TAG_TRANSLATIONS).find(key => TAG_TRANSLATIONS[key] === activeTag);
        const matchEnglish = englishTag ? c.tags.includes(englishTag) : false;

        if (!tagMatch && !matchEnglish) return false;
    }
    return true;
  });

  const handleOpenModal = (config?: OpsConfig) => {
    if (config) {
      setEditingId(config.id);
      setFormData({ ...config });
    } else {
      setEditingId(null);
      setFormData({
        type: activeTab === 'ENV' ? ConfigType.ENV : (activeTab === 'SCRIPT' ? ConfigType.SCRIPT : ConfigType.API),
        name: '',
        description: '',
        content: '',
        method: 'GET',
        tags: []
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.content) return;

    const tagsValue = typeof formData.tags === 'string' 
      ? formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (formData.tags || ['Custom']);

    const configToSave: OpsConfig = {
      id: editingId || Date.now().toString(),
      name: formData.name!,
      description: formData.description || '',
      type: formData.type || ConfigType.API,
      content: formData.content!,
      method: formData.type === ConfigType.API ? (formData.method || 'GET') : undefined,
      tags: tagsValue,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
        onUpdateConfig(configToSave);
    } else {
        onAddConfig(configToSave);
    }
    setShowModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#121212]">
      
      {/* Header Area */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333333] flex-shrink-0">
          <div className="px-6 py-4 flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">{t.title}</h2>
             
             <div className="flex items-center gap-4">
                 {/* View Toggle */}
                 <div className="flex bg-gray-100 dark:bg-[#2d2d2d] rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-[#404040] shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        title={language === 'zh' ? "列表视图" : "List View"}
                    >
                        <LayoutList size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('GRID')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-[#404040] shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        title={language === 'zh' ? "图标视图" : "Grid View"}
                    >
                        <LayoutGrid size={18} />
                    </button>
                 </div>

                 <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
                 >
                    <Plus size={18} /> {t.addConfig}
                 </button>
             </div>
          </div>

          <div className="flex px-6 space-x-8">
             {['API', 'SCRIPT', 'ENV', 'ALL'].map((tabKey) => {
                 const label = t[`tab_${tabKey.toLowerCase()}` as keyof typeof t];
                 const isActive = activeTab === tabKey;
                 return (
                     <button
                        key={tabKey}
                        onClick={() => setActiveTab(tabKey as any)}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                            isActive 
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                     >
                         {label}
                     </button>
                 )
             })}
          </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333333] flex items-center flex-wrap gap-2 shadow-sm z-10 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
             <Tag size={14} /> {t.filter_label}
          </span>
          <button
             onClick={() => setActiveTag('All')}
             className={`px-3 py-1 text-xs rounded-full border transition-all ${
                 activeTag === 'All'
                 ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                 : 'bg-white dark:bg-[#2d2d2d] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#404040] hover:bg-gray-50'
             }`}
          >
              {t.label_all}
          </button>
          {allTags.map(tag => {
              const displayTag = language === 'zh' ? (TAG_TRANSLATIONS[tag] || tag) : tag;
              const isSelected = activeTag === tag || activeTag === displayTag;
              return (
                <button
                    key={tag}
                    onClick={() => setActiveTag(language === 'zh' ? displayTag : tag)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-[#2d2d2d] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#404040] hover:bg-gray-50'
                    }`}
                >
                    {displayTag}
                </button>
              );
          })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#121212]">
         {filteredConfigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Box size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">{t.noData}</p>
            </div>
         ) : viewMode === 'LIST' ? (
             <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-[#333333] overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#333333]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">{t.name}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">{t.type}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">{t.tags}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">{t.method}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[35%]">{t.desc}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right w-[15%]">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
                        {filteredConfigs.map(config => {
                            const displayTag = config.tags[0] 
                                ? (language === 'zh' ? (TAG_TRANSLATIONS[config.tags[0]] || config.tags[0]) : config.tags[0])
                                : '';
                            
                            return (
                                <tr key={config.id} className="group hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-white truncate" title={config.name}>
                                            {config.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block border
                                            ${config.type === ConfigType.API 
                                                ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/50' 
                                                : config.type === ConfigType.ENV
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50'
                                                    : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/50'
                                            }`}
                                        >
                                            {config.type === ConfigType.API ? 'API' : (config.type === ConfigType.ENV ? 'ENV' : 'SCRIPT')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {displayTag && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-[#333333] dark:text-gray-300">
                                                {displayTag}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                            {config.type === ConfigType.API ? config.method : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-500 dark:text-gray-400 truncate max-w-md" title={config.description}>
                                            {config.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(config)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title={t.btn_edit}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteConfig(config.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title={t.btn_delete}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                 </table>
             </div>
         ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-10">
                {filteredConfigs.map(config => (
                    <div 
                        key={config.id} 
                        onClick={() => handleOpenModal(config)}
                        className="group relative flex flex-col p-5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200 cursor-pointer h-full"
                    >
                        {/* Action Buttons Container (Hidden by default, shown on hover) */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteConfig(config.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                title={t.btn_delete}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Top Badge & Header */}
                        <div className="flex justify-between items-start w-full mb-3">
                            <div className={`
                                px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border
                                ${config.type === ConfigType.API 
                                ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400' 
                                : config.type === ConfigType.ENV
                                    ? 'bg-green-50 border-green-100 text-green-600 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400'
                                    : 'bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-900/20 dark:border-purple-900/30 dark:text-purple-400'
                                }
                            `}>
                                {config.type === ConfigType.API ? 'API' : (config.type === ConfigType.ENV ? 'ENV' : 'SCRIPT')}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug mb-2 line-clamp-2 min-h-[1.5rem]">
                            {config.name}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-grow">
                            {config.description}
                        </p>

                        {/* Footer info */}
                         <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto pt-3 border-t border-gray-50 dark:border-[#333333] w-full">
                            {config.type === ConfigType.API && (
                                <span className="font-mono bg-gray-100 dark:bg-[#333333] px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                    {config.method}
                                </span>
                            )}
                            <span className="truncate">{config.tags.join(', ')}</span>
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>

       {/* Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100 dark:border-[#333333]">
                <div className="p-5 border-b border-gray-100 dark:border-[#333333] bg-gray-50/50 dark:bg-[#2d2d2d]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingId ? (language === 'zh' ? '编辑配置' : 'Edit Configuration') : t.addConfig}
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t.type}</label>
                            <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as ConfigType})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                            >
                                <option value={ConfigType.API}>API Interface</option>
                                <option value={ConfigType.SCRIPT}>Shell Script</option>
                                <option value={ConfigType.ENV}>Environment Variable</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                {formData.type === ConfigType.ENV ? t.key : t.name}
                            </label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t.desc}</label>
                        <input 
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t.tags}</label>
                        <input 
                            type="text"
                            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                            onChange={e => setFormData({...formData, tags: e.target.value})}
                            placeholder="e.g. Monitor, Network"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                        />
                    </div>
                    {formData.type === ConfigType.API && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t.method}</label>
                            <select 
                                value={formData.method}
                                onChange={e => setFormData({...formData, method: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                            >
                                <option>GET</option>
                                <option>POST</option>
                                <option>PUT</option>
                                <option>DELETE</option>
                            </select>
                        </div>
                    )}
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                            {formData.type === ConfigType.ENV ? t.value : t.content}
                        </label>
                        <textarea 
                            value={formData.content}
                            onChange={e => setFormData({...formData, content: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#2d2d2d] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-32 font-mono text-sm transition-all"
                        />
                    </div>
                </div>
                <div className="p-5 bg-gray-50 dark:bg-[#1e1e1e] border-t border-gray-100 dark:border-[#333333] flex justify-end gap-3">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#333333] rounded-lg text-sm font-medium transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleSave}
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
}