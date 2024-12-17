import { logger } from '@activepieces/server-shared';
import { CopilotProviderType, ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { createOpenAI } from '@ai-sdk/openai';
import { createAzure } from '@ai-sdk/azure';
import { createAnthropic } from '@ai-sdk/anthropic';
import { platformService } from '../../platform/platform.service';
import { LanguageModel } from 'ai';

// Types
interface AssistantProvider {
  type: CopilotProviderType;
  provider: string;
  apiKey: string;
  resourceName?: string;
  deploymentName?: string;
}

interface CopilotSettings {
  defaultAssistantProvider?: string;
  providers: AssistantProvider[];
}

const AI_PROVIDER = {
  OPENAI: 'openai',
  AZURE: 'azure',
  ANTHROPIC: 'anthropic',
  PERPLEXITY: 'perplexity',
} as const;

type AiProvider = typeof AI_PROVIDER[keyof typeof AI_PROVIDER];

const MODEL_NAMES = {
  [AI_PROVIDER.OPENAI]: 'gpt-4o',
  [AI_PROVIDER.AZURE]: 'gpt-4o',
  [AI_PROVIDER.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
  [AI_PROVIDER.PERPLEXITY]: 'mixtral-8x7b-instruct',
} as const;

function throwConfigError(message: string): never {
  throw new ActivepiecesError({
    code: ErrorCode.COPILOT_FAILED,
    params: { message },
  });
}

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

function validateAzureProvider(provider: AssistantProvider): void {
  if (!provider.resourceName || !provider.deploymentName) {
    throwConfigError('Azure provider requires resourceName and deploymentName');
  }
}

function createModelInstance(provider: AssistantProvider): LanguageModel {
  const providerType = getProviderType(provider.provider);
  logger.debug('[ModelService] Creating model instance', { providerType });

  try {
    switch (providerType) {
      case AI_PROVIDER.OPENAI:
        return createOpenAI({ 
          apiKey: provider.apiKey,
        }).chat(MODEL_NAMES[providerType]);

      case AI_PROVIDER.AZURE:
        validateAzureProvider(provider);
        return createAzure({
          apiKey: provider.apiKey,
          resourceName: provider.resourceName!,
        }).chat(provider.deploymentName!);

      case AI_PROVIDER.ANTHROPIC:
        return createAnthropic({ 
          apiKey: provider.apiKey,
        }).languageModel(MODEL_NAMES[providerType]);

      case AI_PROVIDER.PERPLEXITY:
        return createOpenAI({
          name: AI_PROVIDER.PERPLEXITY,
          apiKey: provider.apiKey,
          baseUrl: 'https://api.perplexity.ai/',
        }).chat(MODEL_NAMES[providerType]);

      default:
        throwConfigError(`Unsupported AI provider: ${providerType}`);
    }
  } catch (error) {
    logger.error('[ModelService] Failed to create model instance', { error, providerType });
    if (error instanceof ActivepiecesError) {
      throw error;
    }
    throwConfigError(error instanceof Error ? error.message : 'Failed to create model instance');
  }
}

export const modelService = {
  async getModel(platformId: string): Promise<LanguageModel> {
    try {
      const platform = await platformService.getOneOrThrow(platformId);
      const { copilotSettings } = platform;

      if (!this.isValidCopilotSettings(copilotSettings)) {
        logger.warn('[ModelService] Invalid or missing copilot settings', { platformId });
        throwConfigError('Invalid or missing copilot settings. Please check your platform settings.');
      }

      const assistantProvider = this.getAssistantProvider(copilotSettings);
      if (!assistantProvider) {
        logger.warn('[ModelService] No assistant provider found', { platformId });
        throwConfigError('No assistant provider configured');
      }

      return createModelInstance(assistantProvider);
    } catch (error) {
      logger.error('[ModelService] Failed to initialize AI model', { error, platformId });
      if (error instanceof ActivepiecesError) {
        throw error;
      }
      throwConfigError(error instanceof Error ? error.message : 'Failed to initialize AI model');
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
