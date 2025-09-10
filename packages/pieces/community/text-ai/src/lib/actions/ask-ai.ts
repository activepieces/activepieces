import { AIUsageFeature, SUPPORTED_AI_PROVIDERS, WebSearchOptions, createAIModel, createWebSearchTool } from '@activepieces/common-ai';
import { createAction, Property } from '@activepieces/pieces-framework';
import { LanguageModelV2 } from '@ai-sdk/provider';
import { ModelMessage, generateText, stepCountIs } from 'ai';
import { aiProps } from '@activepieces/common-ai';

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
    webSearch: aiProps({ modelType: 'language' }).webSearch,
    webSearchOptions: aiProps({ modelType: 'language' }).webSearchOptions,
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as LanguageModelV2;
    const storage = context.store;
    const webSearchOptions = context.propsValue.webSearchOptions as WebSearchOptions;

    const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
    const engineToken = context.server.token;
    const model = createAIModel({
      providerName,
      modelInstance,
      engineToken,
      baseURL,
      metadata: {
        feature: AIUsageFeature.TEXT_AI,
      },
      openaiResponsesModel: true,
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
      model,
      messages: [
        ...(conversation ?? []),
        {
          role: 'user',
          content: context.propsValue.prompt,
        },
      ],
      maxOutputTokens: context.propsValue.maxOutputTokens,
      temperature: (context.propsValue.creativity ?? 100) / 100,
      tools: context.propsValue.webSearch ? createWebSearchTool(providerName, webSearchOptions) : undefined,
      stopWhen: stepCountIs(webSearchOptions?.maxUses ?? 5),
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

    return webSearchOptions.includeSources ? { text: response.text, sources: response.sources } : response.text;
  },
});
