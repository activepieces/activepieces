import {
  InputPropertyMap,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { spreadIfDefined, AIProviderName, getEffectiveProviderAndModel } from '@activepieces/pieces-framework';

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

export function buildWebSearchOptionsProperty(
  getProviderAndModel: (propsValue: Record<string, unknown>) => { provider: string | undefined, model: string | undefined },
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
      const { provider, model } = getProviderAndModel(propsValue);
      if (!provider) {
        return {};
      }
      const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model });
      return buildWebSearchOptionsProps(effectiveProvider ?? provider, params);
    },
  });
}

export function usesNativeWebSearchTools({ provider, model }: { provider: string; model: string | undefined }): boolean {
  const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model });
  return NATIVE_WEB_SEARCH_PROVIDERS.has(effectiveProvider ?? provider);
}

export function sanitizeWebSearchOptions(saved: unknown): Record<string, unknown> {
  if (saved === null || typeof saved !== 'object') {
    return {};
  }
  const options = saved as Record<string, unknown>;
  return {
    ...spreadIfDefined('maxUses', asNumber(options['maxUses'])),
    ...spreadIfDefined('includeSources', asBoolean(options['includeSources'])),
    ...spreadIfDefined('userLocationCity', asText(options['userLocationCity'])),
    ...spreadIfDefined('userLocationRegion', asText(options['userLocationRegion'])),
    ...spreadIfDefined('userLocationCountry', asText(options['userLocationCountry'])),
    ...spreadIfDefined('userLocationTimezone', asText(options['userLocationTimezone'])),
    ...spreadIfDefined('allowedDomains', asDomainList(options['allowedDomains'])),
    ...spreadIfDefined('blockedDomains', asDomainList(options['blockedDomains'])),
    ...spreadIfDefined('searchContextSize', asSearchContextSize(options['searchContextSize'])),
  };
}

function asNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return typeof value === 'boolean' || value === null || value === '' || value === undefined || Number.isNaN(parsed)
    ? undefined
    : parsed;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  return undefined;
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asDomainList(value: unknown): { domain: string }[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const domains = value.flatMap((entry) => {
    if (typeof entry === 'string') {
      return [{ domain: entry }];
    }
    const domain = entry && typeof entry === 'object' ? (entry as Record<string, unknown>)['domain'] : undefined;
    return typeof domain === 'string' ? [{ domain }] : [];
  });
  return domains.length === 0 ? undefined : domains;
}

function asSearchContextSize(value: unknown): 'low' | 'medium' | 'high' | undefined {
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined;
}

const NATIVE_WEB_SEARCH_PROVIDERS: ReadonlySet<string> = new Set([
  AIProviderName.OPENAI,
  AIProviderName.ANTHROPIC,
  AIProviderName.GOOGLE,
]);

