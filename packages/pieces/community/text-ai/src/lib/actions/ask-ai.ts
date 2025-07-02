import { aiProps } from '@activepieces/pieces-common';
import { SUPPORTED_AI_PROVIDERS, createAIProvider } from '@activepieces/shared';
import { createAction, Property } from '@activepieces/pieces-framework';
import { CoreMessage, LanguageModel, generateText } from 'ai';

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
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as LanguageModel;
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
    });

    const conversationKey = context.propsValue.conversationKey
      ? `ask-ai-conversation:${context.propsValue.conversationKey}`
      : null;

    let conversation = null;
    if (conversationKey) {
      conversation = (await storage.get<CoreMessage[]>(
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
      maxTokens: context.propsValue.maxTokens,
      temperature: (context.propsValue.creativity ?? 100) / 100,
      headers: {
        'Authorization': `Bearer ${engineToken}`,
      },
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
