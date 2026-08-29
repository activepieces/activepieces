import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { contextDevAuth } from '../auth';
import { contextApiCall, toStringArray } from '../common/client';

export const searchWeb = createAction({
  name: 'search_web',
  classification: 'SEARCH',
  displayName: 'Search Web',
  description:
    'Search the live web and optionally retrieve page content as Markdown.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search the live web for pages relevant to a natural-language query. Use this to discover URLs or recent information; enable Markdown only when the result page content is also needed.',
    idempotent: true,
  },
  auth: contextDevAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Natural-language search query, optionally with operators such as site:context.dev or an exact quoted phrase. Maximum 500 characters.',
      required: true,
      placeholder: 'latest Context.dev product updates',
    }),
    numResults: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return, from 10 to 100.',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 10,
      max: 100,
      step: 10,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description:
        'Only return results from these domains, such as context.dev or github.com.',
      required: false,
      advanced: true,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Exclude results from these domains, such as pinterest.com.',
      required: false,
      advanced: true,
    }),
    freshness: Property.StaticDropdown({
      displayName: 'Freshness',
      description:
        'Restrict results to content published within this time window.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Last 24 Hours', value: 'last_24_hours' },
          { label: 'Last Week', value: 'last_week' },
          { label: 'Last Month', value: 'last_month' },
          { label: 'Last Year', value: 'last_year' },
        ],
      },
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Two-letter ISO country code used to localize results, such as us, gb, or de.',
      required: false,
      placeholder: 'us',
      advanced: true,
    }),
    queryFanout: Property.Checkbox({
      displayName: 'Expand Query',
      description:
        'Search multiple query variants in parallel for broader recall.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    includeMarkdown: Property.Checkbox({
      displayName: 'Include Markdown',
      description:
        'Scrape each result and include its page content as Markdown.',
      required: false,
      defaultValue: false,
      reveals: ['useMainContentOnly', 'includeLinks', 'includeImages'],
    }),
    useMainContentOnly: Property.Checkbox({
      displayName: 'Main Content Only',
      description:
        'Remove navigation, headers, footers, and sidebars from scraped content.',
      required: false,
      defaultValue: true,
    }),
    includeLinks: Property.Checkbox({
      displayName: 'Include Links',
      description: 'Keep hyperlinks in scraped Markdown.',
      required: false,
      defaultValue: true,
    }),
    includeImages: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Keep image references in scraped Markdown.',
      required: false,
      defaultValue: false,
    }),
    timeoutMs: Property.Number({
      displayName: 'Timeout',
      description: 'Maximum request duration in milliseconds.',
      required: false,
      defaultValue: 30000,
      min: 1000,
      max: 120000,
      advanced: true,
    }),
  },
  async run(context) {
    const response = await contextApiCall<SearchResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/web/search',
      body: buildSearchRequest({
        query: context.propsValue.query,
        numResults: context.propsValue.numResults,
        includeDomains: context.propsValue.includeDomains,
        excludeDomains: context.propsValue.excludeDomains,
        freshness: context.propsValue.freshness,
        country: context.propsValue.country,
        queryFanout: context.propsValue.queryFanout,
        includeMarkdown: context.propsValue.includeMarkdown,
        useMainContentOnly: context.propsValue.useMainContentOnly,
        includeLinks: context.propsValue.includeLinks,
        includeImages: context.propsValue.includeImages,
        timeoutMs: context.propsValue.timeoutMs,
      }),
    });

    return response.results.map((result) => ({
      query: response.query,
      url: result.url,
      title: result.title,
      description: result.description,
      relevance: result.relevance,
      markdown: result.markdown.markdown,
      markdown_status: result.markdown.code,
    }));
  },
});

export function buildSearchRequest(
  params: SearchRequestParams
): Record<string, unknown> {
  const includeDomains = toStringArray(params.includeDomains);
  const excludeDomains = toStringArray(params.excludeDomains);

  return {
    query: params.query,
    numResults: params.numResults,
    ...(includeDomains.length > 0 ? { includeDomains } : {}),
    ...(excludeDomains.length > 0 ? { excludeDomains } : {}),
    ...(params.freshness ? { freshness: params.freshness } : {}),
    ...(params.country ? { country: params.country } : {}),
    queryFanout: params.queryFanout,
    markdownOptions: {
      enabled: params.includeMarkdown,
      useMainContentOnly: params.useMainContentOnly,
      includeLinks: params.includeLinks,
      includeImages: params.includeImages,
    },
    timeoutMS: params.timeoutMs,
  };
}

type SearchResponse = {
  results: SearchResult[];
  query: string;
};

type SearchResult = {
  url: string;
  title: string;
  description: string;
  relevance: string;
  markdown: {
    markdown: string | null;
    code: string;
  };
};

type SearchRequestParams = {
  query: string;
  numResults?: number;
  includeDomains?: unknown;
  excludeDomains?: unknown;
  freshness?: string;
  country?: string;
  queryFanout?: boolean;
  includeMarkdown?: boolean;
  useMainContentOnly?: boolean;
  includeLinks?: boolean;
  includeImages?: boolean;
  timeoutMs?: number;
};
