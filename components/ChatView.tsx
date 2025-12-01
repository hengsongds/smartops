import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, ChevronRight, AlertCircle, Info, Code } from 'lucide-react';
import { Message, OpsConfig, Language, ConfigType, ExecutionLog } from '../types';
import { analyzeUserIntent } from '../services/geminiService';

interface ChatViewProps {
  configs: OpsConfig[];
  language: Language;
  onLogExecute: (log: ExecutionLog) => void;
}

const QuickAction: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-full text-sm hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors text-gray-700 dark:text-gray-200 shadow-sm"
  >
    {label}
  </button>
);

const translations = {
  en: {
    welcome: "Welcome to SmartOps",
    welcomeSub: "I can help you manage your systems, run scripts, and query APIs. Try asking something below.",
    placeholder: "Type a command or ask a question...",
    cmdList: "List Commands",
    checkServer: "Check Server",
    runBackup: "Run Backup",
    executing: "Executing",
    success: "Execution Successful",
    runBtn: "Execute",
    error: "Error processing request.",
    system: "System",
    queueing: "Queued"
  },
  zh: {
    welcome: "欢迎使用智能运维助手",
    welcomeSub: "我可以帮您管理系统、运行脚本和查询接口。请在下方输入您的需求。",
    placeholder: "输入命令或自然语言请求...",
    cmdList: "查看所有命令",
    checkServer: "检查服务器状态",
    runBackup: "执行数据库备份",
    executing: "执行中",
    success: "执行成功",
    runBtn: "立即运行",
    error: "处理请求时出错。",
    system: "系统消息",
    queueing: "已加入队列"
  }
};

const getFormattedTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const ChatView: React.FC<ChatViewProps> = ({ configs, language, onLogExecute }) => {
  const t = translations[language];
  const [inputValue, setInputValue] = useState('');
  
  // Execution Queue State
  const [executionQueue, setExecutionQueue] = useState<string[]>([]);
  // Use ref for locking to prevent re-renders or strict mode double-invocation issues
  const isProcessingRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: `${t.welcome}\n${t.welcomeSub}`,
      timestamp: getFormattedTimestamp()
    }
  ]);

  // Reset welcome message on language change
  useEffect(() => {
    setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'welcome') {
            return [{
                ...prev[0],
                content: `${t.welcome}\n${t.welcomeSub}`
            }];
        }
        return prev;
    });
  }, [language]);

  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Queue Processing Logic
  useEffect(() => {
    const processQueue = async () => {
      // If already processing or queue is empty, do nothing
      // We use a Ref for isProcessing to ensure immediate synchronous locking
      if (isProcessingRef.current || executionQueue.length === 0) return;

      // Lock immediately
      isProcessingRef.current = true;
      const configId = executionQueue[0];
      const config = configs.find(c => c.id === configId);

      try {
        if (config) {
            // 1. Add "Executing..." message
            const execMsgId = Date.now().toString();
            setMessages(prev => [...prev, {
            id: execMsgId,
            role: 'bot',
            content: `${t.executing}: ${config.name}...`,
            timestamp: getFormattedTimestamp()
            }]);

            // 2. Simulate Delay (Network request)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 3. Generate Response
            const { output, status, returnCode, summary, duration } = generateMockResponse(config);

            // 4. Log Execution
            let requestSnapshot = "";
            if (config.type === ConfigType.API) {
                requestSnapshot = `Method: ${config.method || 'GET'}\nURL: ${config.content}`;
            } else {
                requestSnapshot = `Script Content:\n${config.content}`;
            }

            onLogExecute({
            id: Date.now().toString(),
            configId: config.id,
            configName: config.name,
            type: config.type,
            timestamp: new Date().toISOString(),
            durationMs: duration,
            status: status,
            returnCode: returnCode,
            resultSummary: summary,
            requestSnapshot: requestSnapshot,
            responseSnapshot: output
            });

            // 5. Add "Success" message
            setMessages(prev => [...prev, {
                id: (Date.now() + 100).toString(),
                role: 'bot',
                content: `✅ **${t.success}**: ${config.name}\n\n${output}`,
                timestamp: getFormattedTimestamp()
            }]);
        }
      } catch (error) {
          console.error("Error executing command", error);
      } finally {
        // 6. Remove processed item from queue and release lock
        setExecutionQueue(prev => prev.slice(1));
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [executionQueue, configs, onLogExecute, t]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: getFormattedTimestamp()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await analyzeUserIntent(text, configs, language);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: result.reply,
        timestamp: getFormattedTimestamp(),
        relatedConfigId: result.matchedConfigId || undefined,
        suggestedConfigIds: result.suggestedConfigIds
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        content: t.error,
        timestamp: getFormattedTimestamp(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateMockResponse = (config: OpsConfig): { output: string; status: 'SUCCESS' | 'FAILURE'; returnCode: number; summary: string; duration: number } => {
    let output = "";
    let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
    let returnCode = 200;
    let summary = "";
    const duration = Math.floor(Math.random() * 200) + 50;
    
    if (config.type === ConfigType.API) {
         returnCode = 200;
         let data = {};
         // Simple mock logic based on name to make it look real
         if (config.name.includes("User") || config.name.includes("用户")) {
             data = { 
                 users: [
                     {id: 1, name: "admin", role: "admin", status: "active"}, 
                     {id: 2, name: "devops", role: "maintainer", status: "active"},
                     {id: 3, name: "guest", role: "viewer", status: "inactive"}
                 ], 
                 total: 3,
                 page: 1
             };
             summary = "Fetched user list";
         } else if (config.name.includes("System") || config.name.includes("系统")) {
             data = { 
                 os: "Ubuntu Linux 22.04 LTS", 
                 kernel: "5.15.0-88-generic", 
                 uptime: "14 days, 2 hours, 15 minutes", 
                 load_average: [0.12, 0.08, 0.05],
                 memory: { total: "16GB", free: "4.2GB" }
             };
             summary = "System info retrieved";
         } else if (config.name.includes("Status") || config.name.includes("状态")) {
             data = { 
                 status: "HEALTHY", 
                 service_id: "smartops-core-v1", 
                 active_connections: 42, 
                 cpu_usage: "12%", 
                 memory_usage: "45%",
                 last_incident: null
             };
             summary = "Status check passed";
         } else {
             data = { 
                 message: "Operation completed successfully", 
                 config_id: config.id,
                 timestamp: new Date().toISOString() 
             };
             summary = "Operation completed";
         }
         
         output = `**Status**: \`${returnCode} OK\`\n**Time**: \`${duration}ms\`\n**Response**:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    } else {
         returnCode = 0;
         let logs = "";
         if (config.name.includes("Backup") || config.name.includes("备份")) {
             logs = `[INFO] Starting database backup job...\n[INFO] Connecting to database (smart_db)...\n[INFO] Dumping data to /backup/db_${new Date().toISOString().split('T')[0]}.sql\n[INFO] Compressing archive...\n[SUCCESS] Backup completed. Size: 45MB.`;
             summary = "Backup completed (45MB)";
         } else if (config.name.includes("Restart") || config.name.includes("重启")) {
             logs = `[INFO] Stopping service smartops-core...\n[WARN] Waiting for active connections to drain...\n[INFO] Service stopped.\n[INFO] Starting service smartops-core...\n[INFO] Health check passed.\n[SUCCESS] Service restarted successfully.`;
             summary = "Service restart successful";
         } else {
             logs = `[INFO] Starting script execution...\n[INFO] Validating environment variables...\n[INFO] Executing main sequence...\n[SUCCESS] Task completed successfully.`;
             summary = "Script executed successfully";
         }
         
         output = `**Exit Code**: \`${returnCode}\`\n**Output**:\n\`\`\`bash\n${logs}\n\`\`\``;
    }
    
    return { output, status, returnCode, summary, duration };
  };

  const handleExecute = (configId: string) => {
    // Just add to queue, useEffect handles the serial execution
    setExecutionQueue(prev => [...prev, configId]);
  };

  const renderMessageContent = (msg: Message) => {
    // Render list of suggestions
    if (msg.suggestedConfigIds && msg.suggestedConfigIds.length > 0) {
        const suggestedConfigs = msg.suggestedConfigIds
            .map(id => configs.find(c => c.id === id))
            .filter((c): c is OpsConfig => !!c);

        if (suggestedConfigs.length > 0) {
            return (
                <div className="flex flex-col gap-2">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                        {suggestedConfigs.map((config) => {
                            const isInQueue = executionQueue.includes(config.id);
                            return (
                                <div key={config.id} className="bg-white dark:bg-[#2d2d2d] p-3 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm flex justify-between items-center hover:shadow-md transition-shadow group">
                                    <div className="overflow-hidden mr-3">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                config.type === 'API' 
                                                ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                                                : 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                            }`}>
                                                {config.type}
                                            </span>
                                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{config.name}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{config.description}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleExecute(config.id)}
                                        disabled={isInQueue}
                                        className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                                            isInQueue 
                                            ? 'bg-blue-100 text-blue-400 cursor-wait' 
                                            : 'bg-gray-100 text-gray-600 dark:bg-[#404040] dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white'
                                        }`}
                                    >
                                        <Play size={16} fill="currentColor" className="ml-0.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
    }

    // Render single matched config
    const relatedConfig = msg.relatedConfigId ? configs.find(c => c.id === msg.relatedConfigId) : null;

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Helper to parse markdown-like bold and code blocks simply */}
        <div className="whitespace-pre-wrap">
             {msg.content.split('```').map((part, index) => {
                 if (index % 2 === 1) {
                     // Code block
                     const lines = part.trim().split('\n');
                     const lang = lines[0];
                     const code = lines.slice(1).join('\n');
                     return (
                         <div key={index} className="my-2 bg-gray-900 text-gray-100 p-3 rounded-md text-xs font-mono overflow-x-auto border border-gray-700">
                             {code || part.trim()}
                         </div>
                     );
                 } else {
                     // Regular text with bold support
                     return (
                         <span key={index} dangerouslySetInnerHTML={{
                             __html: part
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-[#404040] px-1 rounded font-mono text-xs">$1</code>')
                         }} />
                     );
                 }
             })}
        </div>
        
        {relatedConfig && (
          <div className="mt-2 p-4 bg-white dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 dark:text-gray-100">{relatedConfig.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  relatedConfig.type === 'API' 
                  ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                  : 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
              }`}>
                {relatedConfig.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{relatedConfig.description}</p>
            <div className="bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded text-xs font-mono text-gray-600 dark:text-gray-400 mb-3 border border-gray-200 dark:border-[#333333] break-all">
               {relatedConfig.content}
            </div>
            <button 
              onClick={() => handleExecute(relatedConfig.id)}
              disabled={executionQueue.includes(relatedConfig.id)}
              className={`w-full py-2 flex items-center justify-center gap-2 transition-colors rounded-md font-medium text-sm shadow-sm ${
                  executionQueue.includes(relatedConfig.id)
                  ? 'bg-blue-400 text-white cursor-wait opacity-80'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {executionQueue.includes(relatedConfig.id) ? (
                 <>
                   <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                   {t.queueing}...
                 </>
              ) : (
                 <>
                    <Play size={16} /> {t.runBtn}
                 </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#121212]">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#2d2d2d] text-blue-600 dark:text-blue-400'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <div className={`max-w-[85%]`}>
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium text-gray-500">{msg.role === 'user' ? 'You' : 'SmartOps'}</span>
                    <span className="text-xs text-gray-400">{msg.timestamp}</span>
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : msg.isError 
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none'
                        : 'bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-[#404040]'
                }`}>
                    {renderMessageContent(msg)}
                </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex gap-4">
            <div className="w-10 h-10 bg-white dark:bg-[#2d2d2d] text-blue-600 rounded-full flex items-center justify-center shadow-sm">
               <Bot size={20} />
            </div>
            <div className="bg-white dark:bg-[#2d2d2d] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#333333]">
        
        {/* Quick Actions if empty */}
        {messages.length < 3 && (
            <div className="flex gap-2 mb-4 justify-center flex-wrap">
                <QuickAction label={t.cmdList} onClick={() => handleSendMessage(language === 'zh' ? "列出所有命令" : "List all commands")} />
                <QuickAction label={t.checkServer} onClick={() => handleSendMessage(language === 'zh' ? "检查服务器状态" : "Check server status")} />
                <QuickAction label={t.runBackup} onClick={() => handleSendMessage(language === 'zh' ? "运行数据库备份" : "Run database backup")} />
            </div>
        )}

        <div className="relative max-w-4xl mx-auto">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.placeholder}
                className="w-full pl-6 pr-14 py-4 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#404040] focus:border-blue-500 dark:focus:border-blue-500 outline-none text-gray-800 dark:text-gray-100 rounded-full shadow-inner transition-colors"
            />
            <button 
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full flex items-center justify-center transition-all shadow-md"
            >
                <Send size={18} className={isTyping ? "opacity-50" : ""} />
            </button>
        </div>
      </div>
    </div>
  );
};