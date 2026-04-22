import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { ModelMessage, generateText, stepCountIs } from 'ai';
import { AIProviderName } from '@activepieces/shared';
import { aiProps } from '../../common/props';
import { createAIModel } from '../../common/ai-sdk';
import { buildWebSearchOptionsProperty, buildWebSearchConfig, WebSearchOptions } from '../../common/web-search';

export const askAI = createAction({
  name: 'askAi',
  displayName: 'Ask AI',
  description: 'A flexible AI step. ask it to analyze data, explain, draft, or decide based on your flow\'s data.',
  props: {
    provider: aiProps({ modelType: 'text' }).provider,
    model: aiProps({ modelType: 'text' }).model,
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
    webSearch: Property.Checkbox({
      displayName: 'Web Search',
      required: false,
      defaultValue: false,
      description:
        'Whether to use web search to find information for the AI to use in its response.',
    }),
    webSearchOptions: buildWebSearchOptionsProperty(
      (propsValue) => ({
        provider: propsValue['provider'] as string | undefined,
        model: propsValue['model'] as string | undefined,
      }),
      ['webSearch', 'provider', 'model'],
    ),
  },
  async run(context) {
    const provider = context.propsValue.provider;
    const modelId = context.propsValue.model;
    const storage = context.store;
    const webSearchOptions = (context.propsValue.webSearchOptions ?? {}) as WebSearchOptions;

    const { tools: webSearchTools, providerOptions } = buildWebSearchConfig({
      provider,
      model: modelId,
      webSearchEnabled: !!context.propsValue.webSearch,
      webSearchOptions,
    });

    const model = await createAIModel({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
      openaiResponsesModel: true,
    });

    const conversationKey = context.propsValue.conversationKey
      ? `ask-ai-conversation:${context.propsValue.conversationKey}`
      : null;

    let conversation = null;
    if (conversationKey) {
      conversation = (await storage.get<ModelMessage[]>(conversationKey)) ?? [];
      if (!conversation) {
        await storage.put(conversationKey, { messages: [] });
      }
    }

    const stopWhen = webSearchTools
      ? stepCountIs(webSearchOptions?.maxUses ?? 5)
      : undefined;

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
      tools: webSearchTools,
      stopWhen,
      providerOptions,
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

    const includeSources = webSearchTools && webSearchOptions.includeSources;
    if (includeSources) {
      return { text: response.text, sources: response.sources };
    }
    return response.text;
  },
});
