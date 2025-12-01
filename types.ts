
export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';

export enum ConfigType {
  API = 'API',
  SCRIPT = 'SCRIPT',
  ENV = 'ENV'
}

export interface OpsConfig {
  id: string;
  name: string;
  description: string;
  type: ConfigType;
  content: string; // The URL or the Script code
  method?: string; // GET, POST, etc. for API
  tags: string[];
  lastUpdated: string;
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  relatedConfigId?: string; // If the bot suggests a single specific action
  suggestedConfigIds?: string[]; // If the bot returns a list of options
  isError?: boolean;
}

export interface IntentAnalysisResult {
  matchedConfigId: string | null;
  suggestedConfigIds?: string[];
  reply: string;
  confidence: number;
}

export interface ExecutionLog {
  id: string;
  configId: string;
  configName: string;
  type: ConfigType;
  timestamp: string; // ISO String
  durationMs: number;
  status: 'SUCCESS' | 'FAILURE';
  returnCode: number;
  resultSummary: string;
  requestSnapshot?: string; // Snapshot of what was executed (URL/Script content)
  responseSnapshot?: string; // Snapshot of the full output/response
}

export enum LogStorageType {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  ELASTICSEARCH = 'ELASTICSEARCH'
}

export interface LogSubscription {
  id: string;
  name: string;
  type: LogStorageType;
  status: 'ACTIVE' | 'INACTIVE';
  lastSync?: string;
  config: {
    path?: string; // For LOCAL
    bucket?: string; // For S3
    region?: string; // For S3
    accessKey?: string; // For S3
    endpoint?: string; // For ES
    index?: string; // For ES
  };
}
