import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, ChevronRight, AlertCircle, Info, Code, Terminal, Copy, Check, Maximize2, X, ChevronDown, ChevronUp, Loader2, StopCircle } from 'lucide-react';
import { Message, OpsConfig, Language, ConfigType, ExecutionLog } from '../types';
import { analyzeUserIntent } from '../services/geminiService';

interface ChatViewProps {
  sessionId: string;
  initialMessages: Message[];
  onSessionUpdate: (messages: Message[]) => void;
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
    cancelled: "Execution Cancelled",
    runBtn: "Execute",
    error: "Error processing request.",
    system: "System",
    queueing: "Queued",
    showCurl: "Show cURL Command",
    copy: "Copy",
    copied: "Copied",
    viewFull: "View Full",
    expand: "Expand All",
    collapse: "Collapse",
    close: "Close",
    responseDetails: "Response Details",
    lines: "lines",
    cancel: "Cancel"
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
    cancelled: "已取消执行",
    runBtn: "立即运行",
    error: "处理请求时出错。",
    system: "系统消息",
    queueing: "已加入队列",
    showCurl: "展示 cURL 接口",
    copy: "复制",
    copied: "已复制",
    viewFull: "全屏查看",
    expand: "展开全部",
    collapse: "收起",
    close: "关闭",
    responseDetails: "响应详情",
    lines: "行",
    cancel: "取消"
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

// Helper to build cURL command
const buildCurlCommand = (method: string, data: any) => {
    try {
        let cmd = `curl -X ${method} '${data.url}'`;
        
        if (data.headers) {
            Object.entries(data.headers).forEach(([k, v]) => {
                cmd += ` \\\n  -H '${k}: ${v}'`;
            });
        }

        if (data.body && method !== 'GET') {
             // Avoid adding empty body
             if (Object.keys(data.body).length > 0) {
                 cmd += ` \\\n  -d '${JSON.stringify(data.body)}'`;
             }
        }
        return cmd;
    } catch (e) {
        return "Error building cURL command";
    }
};

// Independent Component for rendering Code Blocks with Collapse/Expand features
const CodeBlock: React.FC<{ code: string; lang: string; t: any }> = ({ code, lang, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Set threshold to 25 lines to enable "Show More" functionality for large responses
    const LINE_THRESHOLD = 25;
    const lines = code.split('\n');
    const isLong = lines.length > LINE_THRESHOLD;

    const handleCopy = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="my-2 group font-mono text-xs">
                {/* Code Container */}
                <div className="bg-gray-900 text-gray-100 rounded-lg border border-gray-700 leading-relaxed shadow-inner relative">
                    
                    {/* Sticky Header: Visible ONLY when Expanded and content is Long. 
                        Sticks to the top of the chat view when scrolling. */}
                    {isLong && isExpanded && (
                        <div className="sticky top-0 left-0 right-0 z-30 flex items-center justify-end gap-2 p-2 bg-gray-900/95 backdrop-blur border-b border-gray-800 rounded-t-lg">
                            {lang && <span className="mr-auto px-2 text-gray-500 text-[10px] uppercase tracking-wider font-semibold">{lang}</span>}
                            
                            <button 
                                onClick={handleCopy}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                title={t.copy}
                            >
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                            
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
                            >
                                <ChevronUp size={14} /> {t.collapse}
                            </button>
                        </div>
                    )}

                    {/* Default Absolute Copy Button: Visible when Collapsed (original behavior) */}
                    {(!isLong || !isExpanded) && (
                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={handleCopy}
                                className="p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors border border-gray-700"
                                title={t.copy}
                             >
                                 {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                             </button>
                        </div>
                    )}

                    {/* Code Content Area */}
                    <div className={`${!isExpanded && isLong ? 'max-h-[300px] overflow-hidden' : ''}`}>
                        <div className="p-4 overflow-x-auto custom-scrollbar">
                            {code}
                        </div>
                    </div>

                    {/* Gradient Overlay for Collapsed State */}
                    {!isExpanded && isLong && (
                         <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-10 pointer-events-none" />
                    )}
                </div>
                
                {/* Bottom Control Bar (Expand / Fullscreen) - Only visible if content is long */}
                {isLong && (
                    <div className={`
                        flex justify-center items-center gap-3 mt-[-1.5rem] relative z-20 
                        ${isExpanded ? 'mt-2' : ''}
                    `}>
                        {!isExpanded ? (
                            <>
                                <button 
                                    onClick={() => setIsExpanded(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-blue-500/50 transition-all hover:scale-105 active:scale-95 font-medium"
                                >
                                    <ChevronDown size={14} /> {t.expand} ({lines.length} {t.lines})
                                </button>
                                <button 
                                    onClick={() => setShowModal(true)} 
                                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-gray-600 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Maximize2 size={13} /> {t.viewFull}
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-[#333333] dark:hover:bg-[#404040] text-gray-700 dark:text-gray-300 text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all border border-gray-300 dark:border-gray-600"
                            >
                                <ChevronUp size={14} /> {t.collapse}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Full Screen Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-gray-700 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#252526] rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <Code size={18} className="text-blue-400" />
                                <h3 className="font-medium text-gray-200">{t.responseDetails}</h3>
                                <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                                    {lines.length} {t.lines}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleCopy}
                                    className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                                    title={t.copy}
                                >
                                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                </button>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-0 bg-[#1e1e1e] custom-scrollbar">
                            <pre className="p-6 text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const ChatView: React.FC<ChatViewProps> = ({ sessionId, initialMessages, onSessionUpdate, configs, language, onLogExecute }) => {
  const t = translations[language];
  const [inputValue, setInputValue] = useState('');
  
  // Execution Queue State
  const [executionQueue, setExecutionQueue] = useState<string[]>([]);
  // Use ref for locking to prevent re-renders or strict mode double-invocation issues
  const isProcessingRef = useRef(false);
  const currentAbortController = useRef<AbortController | null>(null);

  // State for copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize messages from props
  // Note: if initialMessages is empty, we add welcome. But we must respect history.
  const [messages, setMessages] = useState<Message[]>([]);

  // Sync messages from props when Session ID changes
  useEffect(() => {
     if (initialMessages && initialMessages.length > 0) {
         setMessages(initialMessages);
     } else {
         // New Session
         setMessages([{
            id: 'welcome',
            role: 'bot',
            content: `${t.welcome}\n${t.welcomeSub}`,
            timestamp: getFormattedTimestamp()
         }]);
     }
  }, [sessionId, language]); // Added language dep to update welcome msg text if needed (though history persists language)

  // Report changes back to parent
  useEffect(() => {
      // Avoid circular updates or unnecessary calls
      if (messages !== initialMessages) {
          onSessionUpdate(messages);
      }
  }, [messages]);

  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleCopy = (text: string, msgId: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelExecution = (msgId: string) => {
    if (currentAbortController.current) {
        currentAbortController.current.abort();
        // UI update for cancelled state is handled in the catch block of processQueue
    }
  };

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
      const execMsgId = Date.now().toString();

      try {
        if (config) {
            // 1. Add "Executing..." message with status
            setMessages(prev => [...prev, {
                id: execMsgId,
                role: 'bot',
                content: `${t.executing}: ${config.name}...`,
                timestamp: getFormattedTimestamp(),
                status: 'EXECUTING'
            }]);

            // Setup AbortController for Cancellation
            const controller = new AbortController();
            currentAbortController.current = controller;

            // Resolve variables in content
            let resolvedContent = config.content;
            const envConfigs = configs.filter(c => c.type === ConfigType.ENV);
            
            // Replace ${VAR_NAME} with actual value
            envConfigs.forEach(env => {
                const placeholder = `\${${env.name}}`;
                resolvedContent = resolvedContent.split(placeholder).join(env.content);
            });

            // 2. Simulate Delay (Network request) with cancellation support
            // Increased delay to 5s to allow user time to click Cancel
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(() => {
                    resolve();
                }, 5000); 

                controller.signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });

            // 3. Generate Response
            const { output, status, returnCode, summary, duration } = generateMockResponse(config);

            // 4. Log Execution & Generate cURL
            let requestSnapshot = "";
            let generatedCurl = "";

            if (config.type === ConfigType.API) {
                // If it's a JSON string, try to pretty print the resolved content
                try {
                    const jsonObj = JSON.parse(resolvedContent);
                    generatedCurl = buildCurlCommand(config.method || 'GET', jsonObj);
                    resolvedContent = JSON.stringify(jsonObj, null, 2);
                } catch (e) {
                    // Not valid JSON, keep as is
                }
                requestSnapshot = `Method: ${config.method || 'GET'}\nContent: ${resolvedContent}`;
            } else {
                requestSnapshot = `Script Content:\n${resolvedContent}`;
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

            // Update execution message to completed state (visual cleanup) or keep it as history
            // Here we append a NEW success message as per original design, but update the executing one to remove spinner? 
            // Better UX: Update the "Executing" message to be "Completed" or just leave it and append Success.
            // Let's just update the previous message to remove EXECUTING status so the button disappears
            setMessages(prev => prev.map(m => m.id === execMsgId ? { ...m, status: undefined } : m));

            // 5. Add "Success" message
            setMessages(prev => [...prev, {
                id: (Date.now() + 100).toString(),
                role: 'bot',
                content: `✅ **${t.success}**: ${config.name}\n\n${output}`,
                timestamp: getFormattedTimestamp(),
                curlCommand: generatedCurl // Attach generated curl
            }]);
        }
      } catch (error: any) {
          if (error.name === 'AbortError') {
              // Handle Cancellation
              setMessages(prev => prev.map(m => m.id === execMsgId ? {
                  ...m,
                  content: `🚫 **${t.cancelled}**: ${config?.name}`,
                  status: 'CANCELLED'
              } : m));
              
              onLogExecute({
                  id: Date.now().toString(),
                  configId: config?.id || 'unknown',
                  configName: config?.name || 'unknown',
                  type: config?.type || ConfigType.SCRIPT,
                  timestamp: new Date().toISOString(),
                  durationMs: 0,
                  status: 'CANCELLED',
                  returnCode: -1,
                  resultSummary: 'User Cancelled',
                  requestSnapshot: 'Cancelled',
                  responseSnapshot: 'Cancelled'
              });
          } else {
              console.error("Error executing command", error);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'bot',
                content: t.error,
                timestamp: getFormattedTimestamp(),
                isError: true
              }]);
          }
      } finally {
        // 6. Remove processed item from queue and release lock
        setExecutionQueue(prev => prev.slice(1));
        isProcessingRef.current = false;
        currentAbortController.current = null;
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
         
         // Priority Check for RMS DescribeHosts
         if (config.id === 'api-rms-describe-hosts' || config.name.includes("RMS")) {
             const hosts = [];
             for(let i = 1; i <= 50; i++) {
                 hosts.push({
                     "ClusterId": "",
                     "Aid": 0,
                     "name": `11-241-212-${70 + i}.jdstack.local`,
                     "host": `11.241.212.${70 + i}`,
                     "tag": i % 3 === 0 ? "gpu-node" : "",
                     "az": "stack-malaysia-1a",
                     "data_center": "MY-DC-1",
                     "rack": `T2-L5-${150 + Math.floor(i/10)}`,
                     "machine": "general_2",
                     "service_type": "kvm,hyper",
                     "cpus": 96,
                     "memory": 384400,
                     "state": "Enable"
                 });
             }

             data = {
                 "code": 0,
                 "message": "Success",
                 "requestId": "req-" + Math.random().toString(36).substring(7),
                 "total": 50,
                 "data": hosts
             };
             summary = `RMS Hosts listed (${hosts.length} Hosts Found)`;
         }
         // ... other mocks ...
         else if (config.name.includes("User") || config.name.includes("用户")) {
             data = { users: [{id: 1, name: "admin"}, {id: 2, name: "devops"}], total: 2 };
             summary = "Fetched user list";
         } else if (config.name.includes("Status") || config.name.includes("状态")) {
             data = { status: "HEALTHY", active_connections: 42 };
             summary = "Status check passed";
         } else {
             data = { message: "Operation completed successfully", config_id: config.id };
             summary = "Operation completed";
         }
         
         output = `**Status**: \`${returnCode} OK\`\n**Time**: \`${duration}ms\`\n**Response**:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    } else {
         returnCode = 0;
         let logs = "";
         if (config.name.includes("Backup") || config.name.includes("备份")) {
             logs = `[INFO] Starting database backup job...\n[SUCCESS] Backup completed. Size: 45MB.`;
             summary = "Backup completed (45MB)";
         } else {
             logs = `[INFO] Starting script execution...\n[SUCCESS] Task completed successfully.`;
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
        // ... (existing suggestion logic) ...
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

    // Special Rendering for EXECUTING status
    if (msg.status === 'EXECUTING') {
        return (
            <div className="flex items-center justify-between gap-4 min-w-[240px]">
                <div className="flex items-center gap-2.5">
                    <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">{msg.content.replace(`${t.executing}: `, '')}</span>
                </div>
                <button 
                    onClick={() => handleCancelExecution(msg.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-md text-xs font-semibold transition-colors"
                >
                    <StopCircle size={14} />
                    {t.cancel}
                </button>
            </div>
        );
    }
    
    // Render cancelled status specially too if needed, but text content was updated in handle logic
    if (msg.status === 'CANCELLED') {
        return (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 italic">
               <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
        );
    }

    // Render single matched config (standard)
    const relatedConfig = msg.relatedConfigId ? configs.find(c => c.id === msg.relatedConfigId) : null;

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Helper to parse markdown-like bold and code blocks simply */}
        <div className="whitespace-pre-wrap">
             {msg.content.split('```').map((part, index) => {
                 if (index % 2 === 1) {
                     // Code block using dedicated component
                     const lines = part.trim().split('\n');
                     const lang = lines[0];
                     const code = lines.slice(1).join('\n');
                     return <CodeBlock key={index} code={code} lang={lang} t={t} />;
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

        {/* cURL Display Section */}
        {msg.curlCommand && (
            <div className="mt-2 border-t border-gray-100 dark:border-[#404040] pt-2">
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 select-none transition-colors w-fit p-1 rounded hover:bg-blue-50 dark:hover:bg-[#333333]">
                        <Terminal size={14} />
                        {t.showCurl}
                        <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-gray-400" />
                    </summary>
                    <div className="mt-2 relative">
                         <div className="absolute right-2 top-2 z-10">
                             <button 
                                onClick={() => msg.curlCommand && handleCopy(msg.curlCommand, msg.id)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] rounded transition-colors shadow-sm"
                             >
                                 {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                 {copiedId === msg.id ? t.copied : t.copy}
                             </button>
                         </div>
                         <pre className="bg-[#1e1e1e] text-gray-300 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-gray-700 leading-relaxed shadow-inner">
                            {msg.curlCommand}
                         </pre>
                    </div>
                </details>
            </div>
        )}
        
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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-indigo-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              {/* Bubble */}
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-[#333333] text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }`}>
                     {renderMessageContent(msg)}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp.split(' ')[1]}</span>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
              <div className="flex max-w-[85%] gap-3">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Bot size={16} />
                 </div>
                 <div className="bg-white dark:bg-[#1e1e1e] px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-[#333333] flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#333333]">
         {/* Quick Actions */}
         {messages.length === 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
               <QuickAction label={t.cmdList} onClick={() => handleSendMessage(t.cmdList)} />
               <QuickAction label={t.checkServer} onClick={() => handleSendMessage(t.checkServer)} />
               <QuickAction label={t.runBackup} onClick={() => handleSendMessage(t.runBackup)} />
            </div>
         )}
         
         <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.placeholder}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-[#404040] text-white rounded-xl transition-colors shadow-sm flex-shrink-0"
            >
              <Send size={20} />
            </button>
         </div>
      </div>
    </div>
  );
};
