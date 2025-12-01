import React, { useMemo } from 'react';
import { ExecutionLog, Language, ConfigType } from '../types';
import { Activity, CheckCircle, XCircle, Clock, Server, PlayCircle, BarChart2, PieChart } from 'lucide-react';

interface MonitorViewProps {
  logs: ExecutionLog[];
  language: Language;
}

const translations = {
  en: {
    title: "Monitoring Dashboard",
    auditLog: "Execution Audit Log",
    trend: "Execution Trend (7 Days)",
    typeDist: "Execution by Type",
    topInterfaces: "Top 5 Frequent Interfaces",
    totalExec: "Total Executions",
    successRate: "Success Rate",
    avgDuration: "Avg Duration",
    configName: "Interface / Script",
    status: "Status",
    retCode: "Code",
    time: "Time",
    duration: "Duration",
    summary: "Result Summary"
  },
  zh: {
    title: "监控大盘",
    auditLog: "执行审计日志",
    trend: "最近7天执行趋势",
    typeDist: "类型分布分析",
    topInterfaces: "高频接口 Top 5",
    totalExec: "总执行次数",
    successRate: "成功率",
    avgDuration: "平均耗时",
    configName: "接口 / 脚本名称",
    status: "状态",
    retCode: "返回码",
    time: "执行时间",
    duration: "耗时",
    summary: "执行结果摘要"
  }
};

export const MonitorView: React.FC<MonitorViewProps> = ({ logs, language }) => {
  const t = translations[language];

  // Stats Calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(l => l.status === 'SUCCESS').length;
    const successRate = total === 0 ? 0 : Math.round((success / total) * 100);
    const totalDuration = logs.reduce((acc, curr) => acc + curr.durationMs, 0);
    const avgDuration = total === 0 ? 0 : Math.round(totalDuration / total);

    return { total, successRate, avgDuration };
  }, [logs]);

  // Trend Data (Last 7 Days)
  const trendData = useMemo(() => {
    const days = 7;
    const data: { date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const count = logs.filter(l => l.timestamp.startsWith(dateStr)).length;
      data.push({ date: dateStr.slice(5), count }); // MM-DD
    }
    return data;
  }, [logs]);

  // Type Distribution
  const typeData = useMemo(() => {
    const apiCount = logs.filter(l => l.type === ConfigType.API).length;
    const scriptCount = logs.filter(l => l.type === ConfigType.SCRIPT).length;
    const total = logs.length || 1;
    return {
      api: { count: apiCount, percent: (apiCount / total) * 100 },
      script: { count: scriptCount, percent: (scriptCount / total) * 100 }
    };
  }, [logs]);

  // Top Interfaces
  const topInterfaces = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.configName] = (counts[l.configName] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [logs]);

  // Max value for chart scaling
  const maxTrend = Math.max(...trendData.map(d => d.count), 5);
  const maxTop = Math.max(...topInterfaces.map(d => d.count), 5);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#121212] overflow-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333333] px-6 py-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">{t.title}</h2>
      </div>

      <div className="p-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm flex items-center gap-4">
             <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <PlayCircle size={24} />
             </div>
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.totalExec}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
             </div>
          </div>
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm flex items-center gap-4">
             <div className="p-3 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle size={24} />
             </div>
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.successRate}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</p>
             </div>
          </div>
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm flex items-center gap-4">
             <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Clock size={24} />
             </div>
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.avgDuration}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgDuration} ms</p>
             </div>
          </div>
        </div>

        {/* Charts Row 1: Trend & Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Trend Chart */}
           <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Activity size={18} /> {t.trend}
              </h3>
              <div className="h-48 flex items-end gap-2 relative">
                 {/* Y-Axis lines could go here, keeping it simple for now */}
                 {trendData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full flex justify-center items-end h-32">
                             <div 
                                style={{ height: `${(d.count / maxTrend) * 100}%` }}
                                className="w-full max-w-[20px] bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600"
                             ></div>
                             <div className="absolute -top-6 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                 {d.count}
                             </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{d.date}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Type Distribution */}
           <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm flex flex-col">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <PieChart size={18} /> {t.typeDist}
              </h3>
              <div className="flex-1 flex items-center justify-around">
                  {/* CSS Conic Gradient Pie Chart */}
                  <div className="relative w-32 h-32 rounded-full" 
                       style={{ 
                           background: `conic-gradient(#3b82f6 0% ${typeData.api.percent}%, #a855f7 ${typeData.api.percent}% 100%)` 
                        }}>
                        <div className="absolute inset-4 bg-white dark:bg-[#1e1e1e] rounded-full"></div>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">API</p>
                              <p className="text-xs text-gray-500">{typeData.api.count} ({Math.round(typeData.api.percent)}%)</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Script</p>
                              <p className="text-xs text-gray-500">{typeData.script.count} ({Math.round(typeData.script.percent)}%)</p>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Charts Row 2: Top Interfaces */}
        <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm">
             <h3 className="font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <BarChart2 size={18} /> {t.topInterfaces}
             </h3>
             <div className="space-y-4">
                 {topInterfaces.map((item, index) => (
                     <div key={index} className="flex items-center gap-4">
                         <div className="w-48 text-sm text-gray-600 dark:text-gray-400 truncate text-right" title={item.name}>
                             {item.name}
                         </div>
                         <div className="flex-1 h-3 bg-gray-100 dark:bg-[#333333] rounded-full overflow-hidden">
                             <div 
                                style={{ width: `${(item.count / maxTop) * 100}%` }}
                                className="h-full bg-indigo-500 rounded-full"
                             ></div>
                         </div>
                         <div className="w-8 text-xs font-mono text-gray-500">{item.count}</div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333]">
                <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Server size={18} /> {t.auditLog}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-[#333333]">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.configName}</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.status}</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.retCode}</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.duration}</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.time}</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 dark:text-gray-400">{t.summary}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
                        {logs.slice(0, 20).map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#2d2d2d]">
                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={log.configName}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${log.type === ConfigType.API ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                                        {log.configName}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                        log.status === 'SUCCESS' 
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {log.status === 'SUCCESS' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-mono text-gray-600 dark:text-gray-400">
                                    {log.returnCode}
                                </td>
                                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                                    {log.durationMs}ms
                                </td>
                                <td className="px-6 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {log.timestamp.replace('T', ' ').slice(0, 19)}
                                </td>
                                <td className="px-6 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[300px]" title={log.resultSummary}>
                                    {log.resultSummary}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}