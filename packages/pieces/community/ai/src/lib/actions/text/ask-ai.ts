import {
  createAction,
  Property,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { ModelMessage, generateText, stepCountIs } from 'ai';
import { AIProviderName, getEffectiveProviderAndModel, spreadIfDefined } from '@activepieces/shared';
import { aiProps } from '../../common/props';
import { createAIModel, reportUsage } from '../../common/ai-sdk';
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
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
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
    const { provider, model: modelId, prompt, systemPrompt, creativity, maxOutputTokens, webSearch, webSearchOptions, conversationKey } = context.propsValue;
    const storage = context.store;
    const webSearchEnabled = !!webSearch;

    const { tools: webSearchTools, providerOptions } = buildWebSearchConfig({
      provider: provider as string,
      model: modelId,
      webSearchEnabled,
      webSearchOptions: (webSearchOptions ?? {}) as WebSearchOptions,
    });

    const { provider: effectiveProvider } = getEffectiveProviderAndModel({
      provider: provider as AIProviderName,
      model: modelId,
    });
    const model = await createAIModel({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
      ...spreadIfDefined('openaiResponsesModel', webSearchEnabled && effectiveProvider === AIProviderName.OPENAI ? true : undefined),
    });

    const conversationId = conversationKey
      ? `ask-ai-conversation:${conversationKey}`
      : null;

    let conversation: ModelMessage[] | null = null;
    if (conversationId) {
      conversation = (await storage.get<ModelMessage[]>(conversationId)) ?? [];
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
          content: prompt,
        },
      ],
      system: systemPrompt,
      maxOutputTokens,
      temperature: (creativity ?? 100) / 100,
      tools: webSearchTools,
      stopWhen,
      providerOptions,
    });

    if (provider === AIProviderName.ACTIVEPIECES) {
      await reportUsage({
        engineToken: context.server.token,
        apiUrl: context.server.apiUrl,
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
        },
      }).catch(err => {
        console.error('Failed to report AI usage', err)
      })
    }

    if (conversationId && conversation) {
      conversation.push({
        role: 'user',
        content: prompt,
      });

      conversation.push({
        role: 'assistant',
        content: response.text ?? '',
      });

      await storage.put(conversationId, conversation);
    }

    const includeSources = webSearchTools && (webSearchOptions as any).includeSources;
    if (includeSources && 'sources' in response) {
      return { text: response.text, sources: (response as any).sources };
    }
    return response.text ?? '';
  },
});
