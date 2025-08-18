import { aiProps } from '@activepieces/pieces-common';
import { AIUsageFeature, SUPPORTED_AI_PROVIDERS, createAIProvider } from '@activepieces/shared';
import { createAction, Property } from '@activepieces/pieces-framework';
import { LanguageModelV2 } from '@ai-sdk/provider';
import { ModelMessage, generateText } from 'ai';

export const askAI = createAction({
  name: 'askAi',
  displayName: 'Ask AI',
  description: '',
  props: {
    provider: aiProps({ modelType: 'language' }).provider,
    model: aiProps({ modelType: 'language' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    conversationKey: Property.ShortText({
      displayName: 'Conversation Key',
      required: false,
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      required: false,
      defaultValue: 100,
      description:
        'Controls the creativity of the AI response. A higher value will make the AI more creative and a lower value will make it more deterministic.',
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as LanguageModelV2;
    const storage = context.store;

    const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
    const engineToken = context.server.token;
    const provider = createAIProvider({
      providerName,
      modelInstance,
      apiKey: engineToken,
      baseURL,
      metadata: {
        feature: AIUsageFeature.TEXT_AI,
      },
    });

    const conversationKey = context.propsValue.conversationKey
      ? `ask-ai-conversation:${context.propsValue.conversationKey}`
      : null;

    let conversation = null;
    if (conversationKey) {
      conversation = (await storage.get<ModelMessage[]>(
        conversationKey
      )) ?? [];
      if (!conversation) {
        await storage.put(conversationKey, { messages: [] });
      }
    }

    const response = await generateText({
      model: provider,
      messages: [
        ...(conversation ?? []),
        {
          role: 'user',
          content: context.propsValue.prompt,
        },
      ],
      maxOutputTokens: providerName !== 'openai' ? context.propsValue.maxOutputTokens : undefined,
      temperature: (context.propsValue.creativity ?? 100) / 100,
      providerOptions: {
        [providerName]: {
          ...(providerName === 'openai' && context.propsValue.maxOutputTokens ? { max_completion_tokens: context.propsValue.maxOutputTokens } : {}),
        }
      }
    });

    conversation?.push({
      role: 'user',
      content: context.propsValue.prompt,
    });

    conversation?.push({
      role: 'assistant',
      content: response.text ?? '',
    });

    if (conversationKey) {
      await storage.put(conversationKey, conversation);
    }

    return response.text ?? '';
  },
});
