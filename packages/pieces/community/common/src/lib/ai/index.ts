import { ApFile, ServerContext } from '@activepieces/pieces-framework';
import { AI_PROVIDERS, AiProvider } from './providers';

export type AI = {
  provider: string;
  chat: AIChat;
  image?: AIImage;
  moderation?: AIModeration;
  voice?: AIVoice;
};

export type AIModeration = {
  create: (params: AIModerationCreateParams) => Promise<any | null>;
};

export type AIModerationCreateParams = {
  model: string;
  text?: string;
  images?: ApFile[];
  maxTokens?: number;
  voice?: AIVoice;
};

export type AIImage = {
  generate: (
    params: AIImageGenerateParams
  ) => Promise<AIImageCompletion | null>;
  function?: (
    params: AIChatCompletionsCreateParams & {
      functions: AIFunctionDefinition[];
    } & { image: ApFile }
  ) => Promise<AIChatCompletion & { call: AIFunctionCall | null }>;
};

export type AIImageGenerateParams = {
  prompt: string;
  model: string;
  size?: string;
  advancedOptions?: Record<string, unknown>;
};

export type AIImageCompletion = {
  image: string;
};

export type AIChat = {
  text: (params: AIChatCompletionsCreateParams) => Promise<AIChatCompletion>;
  function?: (
    params: AIChatCompletionsCreateParams & {
      functions: AIFunctionDefinition[];
    }
  ) => Promise<AIChatCompletion & { call: AIFunctionCall | null }>;
};

export type AIVoice = {
  createSpeech: (params: AISpeechCreateParams) => Promise<any>;
  createTranscription: (
    params: AITranscriptionCreateParams
  ) => Promise<AITranscriptionCreateResponse>;
};

export type AISpeechCreateParams = {
  model: string;
  input: string;
  voice: string;
  speed?: number;
  response_format?: string;
};

export type AITranscriptionCreateParams = {
  audio: ApFile;
  language: string;
  model: string;
};

export type AITranscriptionCreateResponse = {
  text: string;
};

export type AIChatCompletionsCreateParams = {
  model: string;
  messages: AIChatMessage[];
  creativity?: number;
  maxTokens?: number;
  stop?: string[];
};

export type AIChatCompletion = {
  choices: AIChatMessage[];
  usage?: AIChatCompletionUsage;
};

export type AIChatCompletionUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AIChatMessage = {
  role: AIChatRole;
  content: string;
};

export type AIFunctionCall = {
  id: string;
  function: {
    name: string;
    arguments: unknown;
  };
};

export type AIFunctionDefinition = {
  name: string;
  description: string;
  arguments: AIFunctionArgumentDefinition[];
};

export type AIFunctionArgumentDefinition = {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  isRequired: boolean;
};

export enum AIChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export type AIFactory = (params: {
  proxyUrl: string;
  engineToken: string;
}) => AI;

export const AI = ({
  provider,
  server,
}: {
  provider: AiProvider;
  server: ServerContext;
}): AI => {
  const proxyUrl = `${server.apiUrl}v1/ai-providers/proxy/${provider}`;
  const factory = AI_PROVIDERS.find((p) => p.value === provider)?.factory;
  const impl = factory?.({ proxyUrl, engineToken: server.token });

  if (!impl) {
    throw new Error(`AI provider ${provider} is not registered`);
  }

  const functionCalling = impl.chat.function;

  return {
    provider,
    image: impl.image,
    moderation: impl.moderation,
    voice: impl.voice,
    chat: {
      text: async (params) => {
        try {
          const response = await impl.chat.text(params);
          return response;
        } catch (e: any) {
          if (e?.error?.error) {
            throw e.error.error;
          }
          throw e;
        }
      },
      function: functionCalling
        ? async (params) => {
            try {
              const response = await functionCalling(params);
              return response;
            } catch (e: any) {
              if (e?.error?.error) {
                throw e.error.error;
              }
              throw e;
            }
          }
        : undefined,
    },
  };
};

export * from './providers';
