import {
  createAction,
  InputPropertyMap,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { ModelMessage, ToolSet, generateText, stepCountIs } from 'ai';
import { spreadIfDefined, AIProviderName } from '@activepieces/shared';
import { aiProps } from '../../common/props';
import { anthropicSearchTool, openaiSearchTool, googleSearchTool, createAIModel } from '../../common/ai-sdk';

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
    webSearchOptions: Property.DynamicProperties({
      displayName: 'Web Search Options',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['webSearch', 'provider', 'model'],
      props: async (propsValue) => {
        const webSearchEnabled = propsValue['webSearch'] as unknown as boolean;
        const provider = propsValue['provider'] as unknown as string;

        if (!webSearchEnabled) {
          return {};
        }

        let options: InputPropertyMap = {
          maxUses: Property.Number({
            displayName: 'Max Web Search Uses',
            required: false,
            defaultValue: 5,
            description: 'Maximum number of searches to use. Default is 5.',
          }),
          includeSources: Property.Checkbox({
            displayName: 'Include Sources',
            description:
              'Whether to include the sources in the response. Useful for getting web search details (e.g. search queries, searched URLs, etc).',
            required: false,
            defaultValue: false,
          }),
        };

        const userLocationOptions = {
          userLocationCity: Property.ShortText({
            displayName: 'User Location - City',
            required: false,
            description:
              'The city name for localizing search results (e.g., San Francisco).',
          }),
          userLocationRegion: Property.ShortText({
            displayName: 'User Location - Region',
            required: false,
            description:
              'The region or state for localizing search results (e.g., California).',
          }),
          userLocationCountry: Property.ShortText({
            displayName: 'User Location - Country',
            required: false,
            description:
              'The country code for localizing search results (e.g., US).',
          }),
          userLocationTimezone: Property.ShortText({
            displayName: 'User Location - Timezone',
            required: false,
            description:
              'The IANA timezone ID for localizing search results (e.g., America/Los_Angeles).',
          }),
        };

        if (provider === AIProviderName.ANTHROPIC) {
          options = {
            ...options,
            allowedDomains: Property.Array({
              displayName: 'Allowed Domains',
              required: false,
              description:
                'List of domains to search (e.g., example.com, docs.example.com/blog). Domains should not include HTTP/HTTPS scheme. Subdomains are automatically included unless more specific subpaths are provided. Overrides Blocked Domains if both are provided.',
              properties: {
                domain: Property.ShortText({
                  displayName: 'Domain',
                  required: true,
                }),
              },
            }),
            blockedDomains: Property.Array({
              displayName: 'Blocked Domains',
              required: false,
              description:
                'List of domains to exclude from search (e.g., example.com, docs.example.com/blog). Domains should not include HTTP/HTTPS scheme. Subdomains are automatically included unless more specific subpaths are provided. Overrided by Allowed Domains if both are provided.',
              properties: {
                domain: Property.ShortText({
                  displayName: 'Domain',
                  required: true,
                }),
              },
            }),
            ...userLocationOptions,
          };
        }

        if (provider === AIProviderName.OPENAI) {
          options = {
            ...options,
            searchContextSize: Property.StaticDropdown({
              displayName: 'Search Context Size',
              required: false,
              defaultValue: 'medium',
              options: {
                options: [
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ],
              },
              description:
                'High level guidance for the amount of context window space to use for the search.',
            }),
            ...userLocationOptions,
          };
        }

        return options;
      },
    }),
  },
  async run(context) {
    const provider = context.propsValue.provider;
    const modelId = context.propsValue.model;
    const storage = context.store;
    const webSearchOptions = context.propsValue.webSearchOptions as WebSearchOptions;

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
      tools: context.propsValue.webSearch
        ? createWebSearchTool(provider, webSearchOptions)
        : undefined,
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

    const includeSources = webSearchOptions.includeSources;
    if (includeSources) {
      return { text: response.text, sources: response.sources };
    }
    return response.text;
  },
});

export function createWebSearchTool(
  provider: string,
  options: WebSearchOptions = {}
): ToolSet {
  const defaultMaxUses = 5;

  switch (provider) {
    case AIProviderName.ANTHROPIC: {
      const anthropicOptions = options as AnthropicWebSearchOptions;

      let allowedDomains: string[] | undefined;
      let blockedDomains: string[] | undefined;

      if (
        anthropicOptions.allowedDomains &&
        anthropicOptions.allowedDomains.length > 0
      ) {
        allowedDomains = anthropicOptions.allowedDomains.map(
          ({ domain }) => domain
        );
      }

      if (
        anthropicOptions.blockedDomains &&
        anthropicOptions.blockedDomains.length > 0 &&
        (!anthropicOptions.allowedDomains ||
          anthropicOptions.allowedDomains.length === 0)
      ) {
        blockedDomains = anthropicOptions.blockedDomains.map(
          ({ domain }) => domain
        );
      }

      return {
        web_search: anthropicSearchTool({
          maxUses: anthropicOptions.maxUses ?? defaultMaxUses,
          ...spreadIfDefined(
            'userLocation',
            buildUserLocation(anthropicOptions)
          ),
          ...spreadIfDefined('allowedDomains', allowedDomains),
          ...spreadIfDefined('blockedDomains', blockedDomains),
        }),
      } as any;
    }

    case AIProviderName.OPENAI: {
      const openaiOptions = options as OpenAIWebSearchOptions;

      return {
        web_search_preview: openaiSearchTool({
          ...spreadIfDefined(
            'searchContextSize',
            openaiOptions.searchContextSize
          ),
          ...spreadIfDefined('userLocation', buildUserLocation(openaiOptions)),
        }),
      } as any;
    }

    case AIProviderName.GOOGLE: {
      return {
        google_search: googleSearchTool({}),
      } as any;
    }

    default:
      throw new Error(`Provider ${provider} is not supported for web search`);
  }
}

function buildUserLocation(
  options: UserLocationOptions
): (UserLocationOptions & { type: 'approximate' }) | undefined {
  if (
    !options.userLocationCity &&
    !options.userLocationRegion &&
    !options.userLocationCountry &&
    !options.userLocationTimezone
  ) {
    return undefined;
  }

  return {
    type: 'approximate' as const,
    ...spreadIfDefined('city', options.userLocationCity),
    ...spreadIfDefined('region', options.userLocationRegion),
    ...spreadIfDefined('country', options.userLocationCountry),
    ...spreadIfDefined('timezone', options.userLocationTimezone),
  };
}

type BaseWebSearchOptions = {
  maxUses?: number
  includeSources?: boolean
}

type UserLocationOptions = {
  userLocationCity?: string
  userLocationRegion?: string
  userLocationCountry?: string
  userLocationTimezone?: string
}

type AnthropicWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
  allowedDomains?: { domain: string }[]
  blockedDomains?: { domain: string }[]
}

type OpenAIWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
  searchContextSize?: 'low' | 'medium' | 'high'
}

export type WebSearchOptions = AnthropicWebSearchOptions | OpenAIWebSearchOptions
