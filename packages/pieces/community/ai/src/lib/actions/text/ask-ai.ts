import { AgentPieceProps, AiStepAction, createAction, isNil, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { runOnWorker } from '../../common/ai-step';
import { aiModel, AiModelRequestFields } from '../../common/props';
import { buildWebSearchOptionsProperty, sanitizeWebSearchOptions, usesNativeWebSearchTools } from '../../common/web-search';

export const askAI = createAction({
  audience: 'both',
  name: 'askAi',
  classification: 'READ',
  displayName: 'Ask AI',
  description: 'Ask AI to analyze, explain, draft or decide using your flow data.',
  aiMetadata: { description: 'Sends a free-form prompt to a text model and returns its answer, optionally continuing a multi-turn thread via a Conversation Key or grounding the reply with web search. Pick it for open-ended reasoning, drafting, or judgement over flow data; prefer summarizeText to condense text, classifyText for a fixed label set, extractStructuredData for typed fields, or run_agent when the task needs tools and multiple steps. Requires an AI Model (a tier or a provider/model) plus a prompt; not idempotent, since each call generates a fresh answer and a Conversation Key appends the exchange to stored history.', idempotent: false },
  propertyGroups: [
    {
      key: 'ai_model',
      display: 'section',
      label: 'AI Model',
      icon: 'sliders',
      props: [AgentPieceProps.AI_PROVIDER_MODEL],
    },
    {
      key: 'request',
      display: 'section',
      label: 'Request',
      icon: 'text',
      props: ['prompt', 'conversationKey', 'webSearch', 'webSearchOptions'],
    },
  ],
  props: {
    [AgentPieceProps.AI_PROVIDER_MODEL]: aiModel.prop(),
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
      display: 'stepper',
      min: 0,
      max: 100,
      step: 10,
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
      (propsValue) => webSearchModelOf(aiModel.resolve(propsValue[AgentPieceProps.AI_PROVIDER_MODEL])),
      ['webSearch', AgentPieceProps.AI_PROVIDER_MODEL],
    ),
  },
  async run(context) {
    const model = aiModel.resolveOrThrow(context.propsValue.aiProviderModel);
    const webSearchEnabled = !!context.propsValue.webSearch;
    const webSearchOptions = webSearchOptionsToSend({
      ...webSearchModelOf(model),
      saved: context.propsValue.webSearchOptions,
    });
    const storageKey = conversationStorageKey(context.propsValue.conversationKey);

    const result = await runOnWorker({
      context,
      buildRequest: async () => ({
        action: AiStepAction.ASK_AI,
        ...model,
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

function webSearchModelOf(fields: AiModelRequestFields | undefined): { provider: string | undefined; model: string | undefined } {
  if (isNil(fields) || 'modelTierId' in fields) {
    return { provider: undefined, model: undefined };
  }
  return { provider: fields.provider, model: fields.modelId };
}

function webSearchOptionsToSend({ provider, model, saved }: { provider: string | undefined; model: string | undefined; saved: unknown }): Record<string, unknown> {
  const options = sanitizeWebSearchOptions(saved);
  if (!isNil(provider) && usesNativeWebSearchTools({ provider, model })) {
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
