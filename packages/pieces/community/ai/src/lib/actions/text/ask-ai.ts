import { AiStepAction, createAction, isNil, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { runOnWorker } from '../../common/ai-step';
import { aiProps, aiProviderSelection } from '../../common/props';
import { buildWebSearchOptionsProperty, sanitizeWebSearchOptions, usesNativeWebSearchTools } from '../../common/web-search';

export const askAI = createAction({
  audience: 'both',
  name: 'askAi',
  classification: 'READ',
  displayName: 'Ask AI',
  description: 'Ask AI to analyze, explain, draft or decide using your flow data.',
  aiMetadata: { description: 'Sends a free-form prompt to a text model and returns its answer, optionally continuing a multi-turn thread via a Conversation Key or grounding the reply with web search. Pick it for open-ended reasoning, drafting, or judgement over flow data; prefer summarizeText to condense text, classifyText for a fixed label set, extractStructuredData for typed fields, or run_agent when the task needs tools and multiple steps. Requires a provider/model plus a prompt; not idempotent, since each call generates a fresh answer and a Conversation Key appends the exchange to stored history.', idempotent: false },
  props: {
    provider: aiProps({ modelType: 'text' }).provider,
    model: aiProps({ modelType: 'text' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      placeholder: 'e.g. Draft a friendly reply to this customer email',
    }),
    conversationKey: Property.ShortText({
      displayName: 'Conversation Key',
      required: false,
      description: 'Same key in this flow continues the chat. Empty starts fresh.',
      placeholder: 'e.g. support-chat',
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      required: false,
      description: 'From 0 to 100. Lower is focused, higher is creative.',
      advanced: true,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
      description: 'Longest reply allowed, in tokens. Raise it if a long reply fails or stops short.',
      advanced: true,
    }),
    webSearch: Property.Checkbox({
      displayName: 'Web Search',
      required: false,
      defaultValue: false,
      description: 'Let the AI search the web before it answers.',
    }),
    webSearchOptions: buildWebSearchOptionsProperty(
      (propsValue) => ({
        provider: aiProviderSelection.resolve(propsValue['provider'])?.provider,
        model: propsValue['model'] as string | undefined,
      }),
      ['webSearch', 'provider', 'model'],
    ),
  },
  async run(context) {
    const { provider, configId } = aiProviderSelection.resolveOrThrow(context.propsValue.provider);
    const webSearchEnabled = !!context.propsValue.webSearch;
    const webSearchOptions = webSearchOptionsToSend({
      provider,
      model: context.propsValue.model,
      saved: context.propsValue.webSearchOptions,
    });
    const storageKey = conversationStorageKey(context.propsValue.conversationKey);

    const result = await runOnWorker({
      context,
      buildRequest: async () => ({
        action: AiStepAction.ASK_AI,
        provider,
        ...spreadIfDefined('providerConfigId', configId),
        modelId: context.propsValue.model,
        prompt: context.propsValue.prompt,
        ...spreadIfDefined('maxOutputTokens', context.propsValue.maxOutputTokens),
        ...spreadIfDefined('temperature', isNil(context.propsValue.creativity) ? undefined : context.propsValue.creativity / 100),
        ...spreadIfDefined('conversation', isNil(storageKey) ? undefined : await readConversation(context.store, storageKey)),
        webSearch: { enabled: webSearchEnabled, options: webSearchOptions },
      }),
    });

    if (result.status === 'paused') {
      return {};
    }

    if (!isNil(storageKey) && !isNil(result.output.conversation)) {
      await context.store.put(storageKey, result.output.conversation);
    }

    return result.output.answer;
  },
});

function webSearchOptionsToSend({ provider, model, saved }: { provider: string; model: string; saved: unknown }): Record<string, unknown> {
  const options = sanitizeWebSearchOptions(saved);
  if (usesNativeWebSearchTools({ provider, model })) {
    return options;
  }
  const { includeSources: _onlyWithNativeTools, ...rest } = options;
  return rest;
}

function conversationStorageKey(conversationKey: string | undefined): string | null {
  return conversationKey ? `ask-ai-conversation:${conversationKey}` : null;
}

async function readConversation(store: ConversationStore, storageKey: string): Promise<Record<string, unknown>[]> {
  const stored = await store.get<StoredConversation>(storageKey);
  if (Array.isArray(stored)) {
    return stored;
  }
  if (!isNil(stored) && Array.isArray(stored.messages)) {
    return stored.messages;
  }
  return [];
}

type StoredConversation = Record<string, unknown>[] | { messages?: Record<string, unknown>[] };

type ConversationStore = {
  get<T>(key: string): Promise<T | null>;
};
