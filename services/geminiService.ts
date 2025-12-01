import { GoogleGenAI, Type, Schema } from "@google/genai";
import { OpsConfig, IntentAnalysisResult, Language, ConfigType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the structured output we want from Gemini
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    matchedConfigId: {
      type: Type.STRING,
      description: "The ID of the configuration that best matches the user's request for immediate execution. Return null string if no single match found.",
      nullable: true
    },
    suggestedConfigIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of Configuration IDs that answer the user's query or are semantically related to an ambiguous request.",
      nullable: true
    },
    reply: {
      type: Type.STRING,
      description: "The response to the user. Should be a clarifying question if the request is ambiguous, or a confirmation if executing.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1.",
    }
  },
  required: ["reply", "confidence"],
};

/**
 * Fallback function to perform local keyword matching when API fails
 */
const performLocalFallbackAnalysis = (
  userMessage: string,
  configs: OpsConfig[],
  language: Language
): IntentAnalysisResult => {
  const lowerMsg = userMessage.toLowerCase();
  
  // 1. Check for list/help intent
  if (lowerMsg.includes('list') || lowerMsg.includes('help') || lowerMsg.includes('show') || lowerMsg.includes('what') || lowerMsg.includes('commands') || lowerMsg.includes('命令') || lowerMsg.includes('帮助')) {
    return {
      matchedConfigId: null,
      suggestedConfigIds: configs.map(c => c.id),
      reply: language === 'zh' 
        ? "由于网络限制无法连接 AI 服务，已为您切换到离线模式。以下是所有可用配置：" 
        : "Unable to connect to AI service due to network restrictions. Switched to offline mode. Here are available configs:",
      confidence: 1
    };
  }

  // 2. Fuzzy match for ambiguity or execution
  const matchedConfigs: OpsConfig[] = [];
  const searchTerms = lowerMsg.split(' ').filter(t => t.length > 1);

  configs.forEach(config => {
      const configText = `${config.name} ${config.description} ${config.type} ${config.tags.join(' ')}`.toLowerCase();
      if (searchTerms.some(term => configText.includes(term))) {
          matchedConfigs.push(config);
      }
  });

  if (matchedConfigs.length === 1) {
    return {
      matchedConfigId: matchedConfigs[0].id,
      reply: language === 'zh' 
        ? `（离线模式）已匹配到配置：${matchedConfigs[0].name}` 
        : `(Offline Mode) Matched configuration: ${matchedConfigs[0].name}`,
      confidence: 0.8
    };
  } else if (matchedConfigs.length > 1) {
      return {
          matchedConfigId: null,
          suggestedConfigIds: matchedConfigs.map(c => c.id),
          reply: language === 'zh'
            ? `（离线模式）发现多个相关配置，请具体说明您的意图：`
            : `(Offline Mode) Found multiple matching configs. Please be more specific:`,
          confidence: 0.7
      };
  }

  return {
    matchedConfigId: null,
    reply: language === 'zh'
      ? "（离线模式）未能识别您的指令。请尝试输入“列表”查看所有可用命令。"
      : "(Offline Mode) Could not recognize your command. Try typing 'list' to see all options.",
    confidence: 0
  };
};

export const analyzeUserIntent = async (
  userMessage: string,
  availableConfigs: OpsConfig[],
  language: Language = 'en'
): Promise<IntentAnalysisResult> => {
  // Filter availableConfigs to only include executable ones (API, SCRIPT)
  // We exclude ENV variables as they are not executable commands
  const executableConfigs = availableConfigs.filter(c => c.type !== ConfigType.ENV);

  // If no API key is set, immediately fail over to local fallback
  if (!process.env.API_KEY) {
    return performLocalFallbackAnalysis(userMessage, executableConfigs, language);
  }

  // Create a simplified version of configs to save tokens
  const toolsDescription = executableConfigs.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    tags: c.tags.join(', ')
  }));

  const langInstruction = language === 'zh' 
    ? "IMPORTANT: Provide the 'reply' field in Simplified Chinese (简体中文)." 
    : "IMPORTANT: Provide the 'reply' field in English.";

  const systemInstruction = `
    You are an intelligent operations assistant (SmartOps).
    You have access to a registry of "Available Tools" (APIs and Scripts) provided in the JSON below.

    Your Goal: Analyze the user's natural language input to understand their intent. You must determine if they want to execute a specific tool, query for information, or if their request is ambiguous and requires clarification.

    **Analysis Dimensions:**
    1. **Semantic Association**: Analyze the user's input to find semantic connections with the Name, Description, Tags, or Type of the available tools.
    2. **Natural Language Understanding**: Detect vague or broad requests (e.g., "version", "status", "check") and formulated reflective questions.

    **Rules:**

    1. **Direct Execution Match**: 
       If the user clearly wants to perform a specific action available in the tools (e.g., "Check server status", "Run the backup") and the match is high confidence (>0.7).
       - **matchedConfigId**: The ID of the matching tool.
       - **suggestedConfigIds**: null.
       - **reply**: A concise confirmation message (e.g., "Ready to execute server status check.").

    2. **Ambiguous or Broad Request (Clarification Required)**:
       If the input is semantically related to one or more tools but lacks specificity (e.g., user says "version", "deploy", "what is the config", "platform").
       - **Action**: Find ALL tools that are semantically relevant to the broad term.
       - **matchedConfigId**: Set to null.
       - **suggestedConfigIds**: A list of ALL relevant tool IDs found in the Semantic Association step.
       - **reply**: 
         Construct a response that guides the user.
         1. Acknowledge the ambiguity or state what was found (e.g., "Which version are you referring to?").
         2. CRITICAL: If the user's query involves "version" (版本), "info" (信息), or "platform" (平台), and you are suggesting options, you MUST append the following specific disclaimer text to the end of your reply:
            - If responding in Chinese: "当前接口中心仅支持如下获取相关版本的信息，如需要获取其他平台或具体产品的版本信息，请在配置中心进行更新相关接口。"
            - If responding in English: "Current interface center only supports the following relevant version information. If you need to obtain version information for other platforms or specific products, please update the relevant interfaces in the configuration center."

    3. **List/Query Capabilities**: 
       If the user asks questions like "What commands are available?", "Show me scripts", or general help.
       - **matchedConfigId**: Set to null.
       - **suggestedConfigIds**: A list of relevant IDs.
       - **reply**: A helpful summary.

    4. **Unknown**: 
       If no semantic relation is found.
       - **matchedConfigId**: null.
       - **suggestedConfigIds**: null.
       - **reply**: State that you didn't understand.

    ${langInstruction}
    
    **Available Tools JSON:**
    ${JSON.stringify(toolsDescription)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as IntentAnalysisResult;
    
    if (result.matchedConfigId === "null") {
        result.matchedConfigId = null;
    }

    return result;

  } catch (error: any) {
    console.warn("Gemini Analysis Failed (likely 403 or network). Switching to fallback.", error);
    // Return local fallback on ANY error (including 403 Region not supported)
    return performLocalFallbackAnalysis(userMessage, executableConfigs, language);
  }
};