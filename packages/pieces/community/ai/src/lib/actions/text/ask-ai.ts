import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import type { ModelMessage } from 'ai';
import { AIProviderName, ExecuteAiMode, getEffectiveProviderAndModel, isNil } from '@activepieces/shared';
import { aiProps } from '../../common/props';
import { buildWebSearchOptionsProperty, WebSearchOptions } from '../../common/web-search';

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
    const provider = context.propsValue.provider as AIProviderName;
    const modelId = context.propsValue.model;
    const storage = context.store;
    const webSearchEnabled = !!context.propsValue.webSearch;
    const webSearchOptions = (context.propsValue.webSearchOptions ?? {}) as WebSearchOptions;

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

    // The model runs on the worker (provider credentials never enter the sandbox); the worker also
    // builds the provider-native web-search tools and switches OpenAI to the responses API itself.
    const response = await context.ai.execute({
      mode: ExecuteAiMode.TEXT,
      provider,
      model: modelId,
      messages: [
        ...(conversation ?? []),
        {
          role: 'user',
          content: context.propsValue.prompt,
        },
      ],
      maxOutputTokens: context.propsValue.maxOutputTokens,
      temperature: (context.propsValue.creativity ?? 100) / 100,
      webSearchEnabled,
      webSearchOptions,
      actionName: 'askAi',
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

    // `sources` is only present when tool-based web search ran (OpenAI/Anthropic/Google) — the same
    // providers the old in-sandbox path returned the `{ text, sources }` shape for.
    const includeSources = webSearchEnabled && isToolBasedWebSearchProvider({ provider, model: modelId }) && webSearchOptions.includeSources;
    if (includeSources && !isNil(response.sources)) {
      return { text: response.text, sources: response.sources };
    }
    return response.text;
  },
});

function isToolBasedWebSearchProvider({ provider, model }: { provider: AIProviderName; model: string }): boolean {
  const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model });
  const resolvedProvider = effectiveProvider ?? provider;
  return resolvedProvider === AIProviderName.OPENAI
    || resolvedProvider === AIProviderName.ANTHROPIC
    || resolvedProvider === AIProviderName.GOOGLE;
}
