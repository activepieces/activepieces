import { logger } from '@activepieces/server-shared';
import { CopilotProviderType } from '@activepieces/shared';
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { AzureOpenAIProvider, createAzure } from '@ai-sdk/azure';
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { platformService } from '../../platform/platform.service';
import { LanguageModel } from 'ai';

// Custom error types
class ModelServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ModelServiceError';
  }
}

// Types and Interfaces
interface AssistantProvider {
  type: CopilotProviderType;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  deploymentName?: string;
}

interface CopilotSettings {
  defaultAssistantProvider?: string;
  providers: AssistantProvider[];
}

interface ProviderConfiguration {
  model: string;
  baseUrl?: string;
}

// Constants
const AI_PROVIDER = {
  OPENAI: 'openai',
  AZURE: 'azure',
  ANTHROPIC: 'anthropic',
  PERPLEXITY: 'perplexity',
} as const;

type AiProvider = typeof AI_PROVIDER[keyof typeof AI_PROVIDER];

const PROVIDER_CONFIG: Record<AiProvider, ProviderConfiguration> = {
  [AI_PROVIDER.OPENAI]: {
    model: 'gpt-4o',
  },
  [AI_PROVIDER.AZURE]: {
    model: 'gpt-4o',
  },
  [AI_PROVIDER.ANTHROPIC]: {
    model: 'claude-3-5-sonnet-20241022',
  },
  [AI_PROVIDER.PERPLEXITY]: {
    model: 'mixtral-8x7b-instruct',
    baseUrl: 'https://api.perplexity.ai/',
  },
} as const;

interface AiProviderConfig {
  type: AiProvider;
  baseUrl?: string;
  apiKey: string;
  deploymentName?: string;
}

// Helper Functions
function getProviderType(provider: string): AiProvider {
  const normalizedProvider = provider.toLowerCase();
  
  switch (normalizedProvider) {
    case AI_PROVIDER.AZURE:
      return AI_PROVIDER.AZURE;
    case AI_PROVIDER.ANTHROPIC:
      return AI_PROVIDER.ANTHROPIC;
    case AI_PROVIDER.PERPLEXITY:
      return AI_PROVIDER.PERPLEXITY;
    default:
      return AI_PROVIDER.OPENAI;
  }
}

function validateProviderConfig(config: AiProviderConfig): void {
  if (!config.apiKey) {
    throw new ModelServiceError('API key is required', 'MISSING_API_KEY');
  }

  if (config.type === AI_PROVIDER.AZURE) {
    if (!config.deploymentName) {
      throw new ModelServiceError('Deployment name is required for Azure provider', 'MISSING_DEPLOYMENT_NAME');
    }
    if (!config.baseUrl) {
      throw new ModelServiceError('Base URL is required for Azure provider', 'MISSING_BASE_URL');
    }
  }
}

function createModelInstance(config: AiProviderConfig): LanguageModel {
  logger.debug('[ModelService] Creating model instance', { providerType: config.type });

  try {
    validateProviderConfig(config);
    const providerConfig = PROVIDER_CONFIG[config.type];

    switch (config.type) {
      case AI_PROVIDER.OPENAI:
        return createOpenAI({ 
          apiKey: config.apiKey,
        }).chat(providerConfig.model);

      case AI_PROVIDER.AZURE:
        return createAzure({
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
        }).chat(config.deploymentName!);

      case AI_PROVIDER.ANTHROPIC:
        return createAnthropic({ 
          apiKey: config.apiKey,
        }).languageModel(providerConfig.model);

      case AI_PROVIDER.PERPLEXITY:
        return createOpenAI({
          name: AI_PROVIDER.PERPLEXITY,
          apiKey: config.apiKey,
          baseUrl: providerConfig.baseUrl,
        }).chat(providerConfig.model);

      default:
        throw new ModelServiceError(`Unsupported AI provider: ${config.type}`, 'UNSUPPORTED_PROVIDER');
    }
  } catch (error) {
    if (error instanceof ModelServiceError) {
      throw error;
    }
    logger.error('[ModelService] Failed to create model instance', { error, providerType: config.type });
    throw new ModelServiceError('Failed to create model instance', 'MODEL_CREATION_FAILED');
  }
}

// Model Service Implementation
export const modelService = {
  async getModel(platformId: string): Promise<LanguageModel | null> {
    try {
      const platform = await platformService.getOneOrThrow(platformId);
      const { copilotSettings } = platform;

      if (!this.isValidCopilotSettings(copilotSettings)) {
        logger.warn('[ModelService] Invalid or missing copilot settings', { platformId });
        return null;
      }

      const assistantProvider = this.getAssistantProvider(copilotSettings);
      if (!assistantProvider) {
        logger.warn('[ModelService] No assistant provider found', { platformId });
        return null;
      }

      const providerType = getProviderType(assistantProvider.provider);
      const modelConfig: AiProviderConfig = {
        type: providerType,
        apiKey: assistantProvider.apiKey,
        baseUrl: providerType === AI_PROVIDER.AZURE ? assistantProvider.baseUrl : PROVIDER_CONFIG[providerType].baseUrl,
        deploymentName: providerType === AI_PROVIDER.AZURE ? assistantProvider.deploymentName : undefined,
      };

      logger.debug('[ModelService] Initializing model', { provider: providerType });
      return createModelInstance(modelConfig);
    } catch (error) {
      if (error instanceof ModelServiceError) {
        logger.error('[ModelService] Model service error', { 
          code: error.code, 
          message: error.message, 
          platformId 
        });
      } else {
        logger.error('[ModelService] Failed to initialize AI model', { error, platformId });
      }
      return null;
    }
  },

  getAssistantProvider(copilotSettings: CopilotSettings): AssistantProvider | null {
    const { defaultAssistantProvider, providers } = copilotSettings;
    
    return providers.find(provider => 
      provider.type === CopilotProviderType.ASSISTANT &&
      (!defaultAssistantProvider || provider.provider === defaultAssistantProvider)
    ) || null;
  },

  isValidCopilotSettings(settings: unknown): settings is CopilotSettings {
    if (!settings || typeof settings !== 'object') return false;
    
    const copilotSettings = settings as CopilotSettings;
    return Array.isArray(copilotSettings.providers) && copilotSettings.providers.length > 0;
  },
};
