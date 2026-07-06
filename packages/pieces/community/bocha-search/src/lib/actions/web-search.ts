import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bochaAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { freshnessDropdown, countProp } from '../common/props';

export const webSearchAction = createAction({
  name: 'web_search',
  displayName: 'Web Search',
  description: 'Search the web using Bocha.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a Bocha web search for a query and returns matching web pages, optionally with per-result text summaries. Pick this to look up current information on the public web; results can be narrowed by freshness window, capped result count, and include/exclude domain lists (up to 100 domains each, separated by | or ,). Read-only and idempotent — repeating the same query just fetches results again.',
    idempotent: true,
  },
  auth: bochaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query.',
      required: true,
    }),
    freshness: freshnessDropdown,
    summary: Property.Checkbox({
      displayName: 'Show Summary',
      description: 'Include a text summary for each search result.',
      required: false,
      defaultValue: true,
    }),
    include: Property.ShortText({
      displayName: 'Include Domains',
      description: 'Limit search to specific domains. Separate multiple domains with | or , (max 100).',
      required: false,
    }),
    exclude: Property.ShortText({
      displayName: 'Exclude Domains',
      description: 'Exclude specific domains from search results. Separate multiple domains with | or , (max 100).',
      required: false,
    }),
    count: countProp,
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      query: propsValue['query'],
      count: propsValue['count'],
    };
    if (propsValue['freshness']) {
      body['freshness'] = propsValue['freshness'];
    }
    if (propsValue['summary'] !== undefined && propsValue['summary'] !== null) {
      body['summary'] = propsValue['summary'];
    }
    if (propsValue['include']) {
      body['include'] = propsValue['include'];
    }
    if (propsValue['exclude']) {
      body['exclude'] = propsValue['exclude'];
    }

    const response = await makeRequest<BochaWebSearchResponse>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/web-search',
      body,
    });

    return response.data ?? {};
  },
});

type BochaWebPage = {
  id?: string;
  name?: string;
  url?: string;
  displayUrl?: string;
  snippet?: string;
  summary?: string;
  siteName?: string;
  siteIcon?: string;
  datePublished?: string;
  dateLastCrawled?: string;
  cachedPageUrl?: string;
  language?: string;
  isFamilyFriendly?: boolean;
  isNavigational?: boolean;
};

type BochaWebSearchResponse = {
  data?: {
    _type?: string;
    queryContext?: unknown;
    webPages?: {
      value?: BochaWebPage[];
    };
    images?: unknown;
    videos?: unknown;
  };
};
