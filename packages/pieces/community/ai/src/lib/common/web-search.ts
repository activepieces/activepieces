import {
  InputPropertyMap,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { ToolSet } from 'ai';
import { ProviderOptions } from '@ai-sdk/provider-utils';
import { spreadIfDefined, AIProviderName } from '@activepieces/shared';
import { anthropicSearchTool, openaiSearchTool, googleSearchTool } from './ai-sdk';

function buildWebSearchOptionsProps(provider: string, params?: { showIncludeSources?: boolean }): InputPropertyMap {
  const showIncludeSources = params?.showIncludeSources ?? true;
  const isOpenRouterProvider =
    provider === AIProviderName.OPENROUTER ||
    provider === AIProviderName.ACTIVEPIECES;
  const supportsToolBasedWebSearch =
    provider === AIProviderName.OPENAI ||
    provider === AIProviderName.ANTHROPIC ||
    provider === AIProviderName.GOOGLE;

  let options: InputPropertyMap = {
    maxUses: Property.Number({
      displayName: 'Max Web Search Uses',
      required: false,
      defaultValue: 5,
      description: isOpenRouterProvider
        ? 'For OpenRouter/Activepieces, this maps to OpenRouter web plugin max_results (1-10). Default is 5.'
        : 'Maximum number of searches to use. Default is 5.',
    }),
  };

  if (supportsToolBasedWebSearch && showIncludeSources) {
    options = {
      ...options,
      includeSources: Property.Checkbox({
        displayName: 'Include Sources',
        description:
          'Whether to include the sources in the response. Useful for getting web search details (e.g. search queries, searched URLs, etc).',
        required: false,
        defaultValue: false,
      }),
    };
  }

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

function createWebSearchTool(
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

export function buildWebSearchOptionsProperty(
  getProvider: (propsValue: Record<string, unknown>) => string | undefined,
  refreshers: string[],
  params?: { showIncludeSources?: boolean },
) {
  return Property.DynamicProperties({
    displayName: 'Web Search Options',
    required: false,
    auth: PieceAuth.None(),
    refreshers,
    props: async (propsValue) => {
      const webSearchEnabled = propsValue['webSearch'] as unknown as boolean;
      if (!webSearchEnabled) {
        return {};
      }
      const provider = getProvider(propsValue);
      if (!provider) {
        return {};
      }
      return buildWebSearchOptionsProps(provider, params);
    },
  });
}

export function buildWebSearchConfig(params: {
  provider: string
  webSearchEnabled: boolean
  webSearchOptions: WebSearchOptions
}): { tools: ToolSet | undefined, providerOptions: ProviderOptions | undefined } {
  const { provider, webSearchEnabled, webSearchOptions } = params;

  if (!webSearchEnabled) {
    return { tools: undefined, providerOptions: undefined };
  }

  const isOpenRouter =
    provider === AIProviderName.OPENROUTER ||
    provider === AIProviderName.ACTIVEPIECES;

  if (isOpenRouter) {
    return {
      tools: undefined,
      providerOptions: {
        openrouter: {
          plugins: [{
            id: 'web' as const,
            max_results: Math.min(
              Math.max(webSearchOptions?.maxUses ?? 5, 1),
              10
            ),
          }],
        },
      },
    };
  }

  return {
    tools: createWebSearchTool(provider, webSearchOptions),
    providerOptions: undefined,
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
