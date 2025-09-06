export type createSourceUrlParams = {
  teamId: string;
  botId: string;
};

export interface AuthenticationParams {
  apiKey: string;
}

export interface askQuestionRequestParams extends AuthenticationParams {
  teamId: string;
  botId: string;
  stream?: boolean;
  conversationId: string;
  question: string;
  metadata?: object;
  context_items?: number;
  human_escalation?: boolean;
  followup_rating?: boolean;
  document_retriever?: boolean;
  full_source?: boolean;
  autocut?: number | boolean;
  testing?: boolean;
  image_urls?: string[];
  model?: string;
  default_language?: string;
  reasoning_effort?: string;
}

export interface createSourceParams {
  teamId: string;
  botId: string;
  type: string;
  title?: string;
  url?: string;
  file?: string;
  faqs?: { question: string; answer: string }[];
  scheduleInterval?: string;
}
export interface createSourceRequestParams
  extends AuthenticationParams,
    createSourceParams {}

export interface createBotRequestParams extends AuthenticationParams {
  teamId: string;
  name: string;
  description: string;
  privacy: 'public' | 'private';
  language: 'en' | 'jp';
  model?: 'string';
  embeddingModel?:
    | 'text-embedding-ada-002'
    | 'text-embedding-3-large'
    | 'text-embedding-3-small'
    | 'embed-multilingual-v3.0'
    | 'embed-v4.0';
  copyFrom?: string;
}

export interface findBotParams extends AuthenticationParams {
  teamId: string;
  name: string;
}

export interface uploadSourceFileRequestParams extends AuthenticationParams {
  teamId: string;
  botId: string;
  fileName: string;
}

export interface uploadToCloudStorageParams {
  uploadUrl: string;
  file: Buffer;
}

export interface listBotsParams extends AuthenticationParams {
  teamId: string;
}

// API Response Objects
export interface Team {
  id: string;
  roles: Record<string, string>[];
  name: string;
  createdAt: string;
  status: string;
  questionCount: number;
  pageCount: number;
  sourceCount: number;
  chunkCount: number;
  openAIKey: string;
  botCount: number;
  plan: {
    name: string;
    bots: number;
    sources: number;
    pages: number;
    questions: number;
  };
}

export interface Bot {
  id: string;
  questionCount: number;
  name: string;
  description: string;
  privacy: 'public' | 'private';
  indexId: string;
  customPrompt: null;
  language: string;
  model: string;
  createdAt: string;
  sourceCount: number;
  pageCount: number;
  chunkCount: number;
  status: string;
}

export interface PresignedUpdateUrlResponse {
  url: string;
  file: string;
}
