import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { contextDevAuth } from '../auth';
import { contextApiCall, flattenRecord, toQueryParams } from '../common/client';

export const findWebsitePages = createAction({
  name: 'find_website_pages',
  classification: 'SEARCH',
  displayName: 'Find Website Pages',
  description: 'Discover page URLs from a website sitemap.',
  audience: 'both',
  aiMetadata: {
    description:
      'Discover URLs from a website sitemap without downloading page content. Use an optional topic query to rank only relevant pages; use Crawl Website when the page Markdown is also needed.',
    idempotent: true,
  },
  auth: contextDevAuth,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Website domain to inspect, such as context.dev.',
      required: true,
      placeholder: 'context.dev',
    }),
    search: Property.ShortText({
      displayName: 'Topic',
      description:
        'Optional topic used to rank and return only relevant page URLs.',
      required: false,
      placeholder: 'API pricing and plans',
    }),
    maxLinks: Property.Number({
      displayName: 'Maximum Links',
      description: 'Maximum number of URLs to return, from 1 to 100000.',
      required: false,
      defaultValue: 100,
      display: 'stepper',
      min: 1,
      max: 100000,
      step: 1,
    }),
    sitemapUrl: Property.ShortText({
      displayName: 'Sitemap URL',
      description:
        'Specific sitemap URL to use instead of automatic discovery.',
      required: false,
      placeholder: 'https://www.context.dev/sitemap.xml',
      advanced: true,
    }),
    urlRegex: Property.ShortText({
      displayName: 'URL Pattern',
      description:
        'RE2-compatible regular expression used to keep matching URLs.',
      required: false,
      placeholder: '/docs/.*',
      advanced: true,
    }),
    timeoutMs: Property.Number({
      displayName: 'Timeout',
      description: 'Maximum request duration in milliseconds.',
      required: false,
      defaultValue: 60000,
      min: 1000,
      max: 120000,
      advanced: true,
    }),
  },
  async run(context) {
    const response = await contextApiCall<SitemapResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/web/scrape/sitemap',
      queryParams: buildSitemapQuery({
        domain: context.propsValue.domain,
        search: context.propsValue.search,
        maxLinks: context.propsValue.maxLinks,
        sitemapUrl: context.propsValue.sitemapUrl,
        urlRegex: context.propsValue.urlRegex,
        timeoutMs: context.propsValue.timeoutMs,
      }),
    });
    const sitemapMetadata = flattenRecord(response.meta, 'sitemap');

    return response.urls.map((url) => ({
      url,
      domain: response.domain,
      ...sitemapMetadata,
    }));
  },
});

export function buildSitemapQuery(
  params: SitemapQueryParams
): Record<string, string> {
  return toQueryParams({
    domain: params.domain,
    search: params.search,
    maxLinks: params.maxLinks,
    sitemapUrl: params.sitemapUrl,
    urlRegex: params.urlRegex,
    timeoutMS: params.timeoutMs,
  });
}

type SitemapResponse = {
  success: boolean;
  domain: string;
  urls: string[];
  meta: Record<string, unknown>;
};

type SitemapQueryParams = {
  domain: string;
  search?: string;
  maxLinks?: number;
  sitemapUrl?: string;
  urlRegex?: string;
  timeoutMs?: number;
};
