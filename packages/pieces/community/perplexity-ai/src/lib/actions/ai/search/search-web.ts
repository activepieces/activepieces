import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

const SEARCH_TYPES = ['web', 'fast', 'people'];
const RECENCY_FILTERS = ['hour', 'day', 'week', 'month', 'year'];

export const searchWebAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_search_web',
  displayName: 'Search the Web',
  description:
    'Get ranked web search results with page content from Perplexity.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs a Perplexity web search and returns raw ranked results (title, url, snippet, dates) with extracted page content, without an AI-written answer. Pick it when you need sources to read yourself; use Create Agent Response or Ask AI for a written, cited answer. Up to 5 queries in one call are billed as one request; dates are MM/DD/YYYY.',
    idempotent: true,
  },
  props: {
    query: Property.Array({
      displayName: 'Queries',
      description: 'One to five search queries.',
      required: true,
    }),
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description:
        '"web" (default), "fast" for lower latency and cost, or "people" for people search.',
      required: false,
      options: {
        disabled: false,
        options: SEARCH_TYPES.map((value) => ({ label: value, value })),
      },
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description:
        'Results to return, 1-20 for web search and up to 50 for people search. Defaults to 10.',
      required: false,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum page content tokens returned across all results.',
      required: false,
    }),
    maxTokensPerPage: Property.Number({
      displayName: 'Max Tokens Per Page',
      description: 'Maximum content tokens extracted from each result page.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'ISO 3166-1 alpha-2 country code to localize results, e.g. "US".',
      required: false,
    }),
    searchLanguageFilter: Property.Array({
      displayName: 'Languages',
      description: 'ISO 639-1 language codes to limit results to, e.g. "en".',
      required: false,
    }),
    searchDomainFilter: Property.Array({
      displayName: 'Domains',
      description:
        'Up to 20 domains to limit results to, e.g. "wikipedia.org".',
      required: false,
    }),
    searchRecencyFilter: Property.StaticDropdown({
      displayName: 'Recency',
      description:
        'Only results published within the last hour, day, week, month or year.',
      required: false,
      options: {
        disabled: false,
        options: RECENCY_FILTERS.map((value) => ({ label: value, value })),
      },
    }),
    searchAfterDateFilter: Property.ShortText({
      displayName: 'Published After',
      description: 'Only results published after this date, MM/DD/YYYY.',
      required: false,
    }),
    searchBeforeDateFilter: Property.ShortText({
      displayName: 'Published Before',
      description: 'Only results published before this date, MM/DD/YYYY.',
      required: false,
    }),
    lastUpdatedAfterFilter: Property.ShortText({
      displayName: 'Updated After',
      description: 'Only results updated after this date, MM/DD/YYYY.',
      required: false,
    }),
    lastUpdatedBeforeFilter: Property.ShortText({
      displayName: 'Updated Before',
      description: 'Only results updated before this date, MM/DD/YYYY.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/search',
      body: {
        query: p.query,
        search_type: p.searchType,
        max_results: p.maxResults,
        max_tokens: p.maxTokens,
        max_tokens_per_page: p.maxTokensPerPage,
        country: p.country,
        search_language_filter: nonEmpty({ items: p.searchLanguageFilter }),
        search_domain_filter: nonEmpty({ items: p.searchDomainFilter }),
        search_recency_filter: p.searchRecencyFilter,
        search_after_date_filter: p.searchAfterDateFilter,
        search_before_date_filter: p.searchBeforeDateFilter,
        last_updated_after_filter: p.lastUpdatedAfterFilter,
        last_updated_before_filter: p.lastUpdatedBeforeFilter,
      },
    });
  },
});

function nonEmpty({
  items,
}: {
  items: unknown[] | undefined;
}): unknown[] | undefined {
  return items && items.length > 0 ? items : undefined;
}
