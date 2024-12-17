import { logger } from '@activepieces/server-shared';
import { CopilotProviderType, } from '@activepieces/shared';
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { AzureOpenAIProvider, createAzure } from '@ai-sdk/azure';
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { platformService } from '../../platform/platform.service';
import { LanguageModel, LanguageModelV1 } from 'ai';

/** Supported AI providers */
enum AiProvider {
  OPENAI = 'openai',
  AZURE = 'azure',
  ANTHROPIC = 'anthropic',
  PERPLEXITY = 'perplexity',
}

/** Default model names for each provider */
const DEFAULT_MODELS: Record<AiProvider, string> = {
  [AiProvider.OPENAI]: 'gpt-4',
  [AiProvider.AZURE]: 'gpt-4',
  [AiProvider.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
  [AiProvider.PERPLEXITY]: 'mixtral-8x7b-instruct',
} as const;

/** Configuration for AI provider initialization */
interface AiProviderConfig {
  type: AiProvider;
  baseUrl?: string;
  apiKey: string;
  deploymentName?: string; // Required for Azure
}

type ModelInstance = OpenAIProvider | AzureOpenAIProvider | AnthropicProvider

/**
 * Factory function to create an AI model instance.
 * Ensures that only one instance is created per provider type.
 */
const createModelInstance = (config: AiProviderConfig): LanguageModel => {
  logger.debug('[createModelInstance] Creating model instance', { config })

  try {
    switch (config.type) {
      case AiProvider.OPENAI:
        return createOpenAI({ apiKey: config.apiKey  }).chat('gpt-4o');
      case AiProvider.AZURE:
        if (!config.deploymentName) {
          throw new Error('Deployment name is required for Azure provider.');
        }
        return createAzure({
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
          resourceName: config.deploymentName
        }).chat('gpt-4o');
      case AiProvider.ANTHROPIC:
        return createAnthropic({ apiKey: config.apiKey }).languageModel('claude-3-5-sonnet-20241022');
      case AiProvider.PERPLEXITY:
        return createOpenAI({
            name: AiProvider.PERPLEXITY,
            apiKey: config.apiKey,
            baseUrl: 'https://api.perplexity.ai/',
        }).chat('mixtral-8x7b-instruct');
      default:
        throw new Error(`Unsupported AI provider: ${config.type}`);
    }
  } catch (error) {
    logger.error('[createModelInstance] Failed to create model instance', { error, config })
    throw error;
  }
};

const getProviderType = (provider: string, baseUrl?: string): AiProvider => {
  const normalizedProvider = provider.toLowerCase();
  switch (normalizedProvider) {
      case 'azure':
          return AiProvider.AZURE;
      case 'anthropic':
          return AiProvider.ANTHROPIC;
      case 'perplexity':
          return AiProvider.PERPLEXITY;
      default:
          return AiProvider.OPENAI;
  }
};

export const modelService = {
  /**
   * Get an AI model instance based on platform settings
   * @param platformId - The platform ID to get settings from
   * @returns A configured model instance or null if configuration fails
   */
  async getModel(platformId: string): Promise<LanguageModel | null> {


    try {
      const platform = await platformService.getOneOrThrow(platformId);
      const { copilotSettings } = platform;

      if (!copilotSettings?.providers?.length) {
        logger.warn('[getModel] No copilot providers configured', { platformId });
        return null;
      }

      const assistantProvider = this.getAssistantProvider(copilotSettings);
      if (!assistantProvider) {
        logger.warn('[getModel] No assistant provider found', { platformId });
        return null;
      }

      const providerType = getProviderType(assistantProvider.provider, assistantProvider.baseUrl);
      const modelConfig: AiProviderConfig = {
        type: providerType,
        apiKey: assistantProvider.apiKey,
        baseUrl: assistantProvider.baseUrl,
        deploymentName: providerType === AiProvider.AZURE ? assistantProvider.deploymentName : undefined,
      };

      logger.debug('[getModel] Using provider', { provider: providerType });

      return createModelInstance(modelConfig);
    } catch (error) {
      logger.error('[getModel] Failed to initialize AI model', { error, platformId });
      return null;
    }
  },

  /**
   * Finds the appropriate assistant provider based on copilot settings.
   *
   * @param copilotSettings - The copilot settings object.
   * @returns The assistant provider or null if not found.
   */
  getAssistantProvider(copilotSettings: any) {
    const { defaultAssistantProvider, providers } = copilotSettings;

    return providers.find((p: any) =>
      p.type === CopilotProviderType.ASSISTANT &&
      (!defaultAssistantProvider || p.provider === defaultAssistantProvider)
    );
  }
};
