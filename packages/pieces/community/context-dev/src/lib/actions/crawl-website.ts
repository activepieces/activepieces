import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { contextDevAuth } from '../auth';
import { contextApiCall, flattenRecord } from '../common/client';

export const crawlWebsite = createAction({
  name: 'crawl_website',
  classification: 'SEARCH',
  displayName: 'Crawl Website',
  description:
    'Crawl linked pages from a website and return their content as Markdown.',
  audience: 'both',
  aiMetadata: {
    description:
      'Crawl multiple linked pages starting from one URL and return each page as Markdown. Use this when content across a site is needed; use Scrape URL for one known page or Find Website Pages when only URLs are needed.',
    idempotent: true,
  },
  auth: contextDevAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Start URL',
      description: 'Full HTTP or HTTPS URL where the crawl should begin.',
      required: true,
      placeholder: 'https://docs.context.dev',
    }),
    maxPages: Property.Number({
      displayName: 'Maximum Pages',
      description: 'Maximum number of pages to crawl, from 1 to 500.',
      required: false,
      defaultValue: 25,
      display: 'stepper',
      min: 1,
      max: 500,
      step: 1,
    }),
    maxDepth: Property.Number({
      displayName: 'Maximum Depth',
      description:
        'Maximum number of link levels away from the start URL. Use 0 for only the start page.',
      required: false,
      min: 0,
      advanced: true,
    }),
    urlRegex: Property.ShortText({
      displayName: 'URL Pattern',
      description:
        'RE2-compatible regular expression used to keep matching crawl URLs.',
      required: false,
      placeholder: '/docs/.*',
      advanced: true,
    }),
    followSubdomains: Property.Checkbox({
      displayName: 'Follow Subdomains',
      description:
        'Allow the crawler to follow links to subdomains of the start domain.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    useMainContentOnly: Property.Checkbox({
      displayName: 'Main Content Only',
      description:
        'Remove navigation, headers, footers, and sidebars from each page.',
      required: false,
      defaultValue: true,
    }),
    includeLinks: Property.Checkbox({
      displayName: 'Include Links',
      description: 'Keep hyperlinks in the Markdown output.',
      required: false,
      defaultValue: true,
    }),
    includeImages: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Keep image references in the Markdown output.',
      required: false,
      defaultValue: false,
    }),
    maxAgeMs: Property.Number({
      displayName: 'Cache Maximum Age',
      description:
        'Maximum cache age in milliseconds. Use 0 to force fresh page fetches.',
      required: false,
      defaultValue: 86400000,
      min: 0,
      max: 2592000000,
      advanced: true,
    }),
    waitForMs: Property.Number({
      displayName: 'Wait After Load',
      description:
        'Extra wait after each page loads, in milliseconds from 0 to 30000.',
      required: false,
      min: 0,
      max: 30000,
      advanced: true,
    }),
    stopAfterMs: Property.Number({
      displayName: 'Crawl Time Limit',
      description:
        'Stop the crawl after this many milliseconds and return pages collected so far.',
      required: false,
      advanced: true,
    }),
    timeoutMs: Property.Number({
      displayName: 'Timeout',
      description: 'Maximum request duration in milliseconds.',
      required: false,
      defaultValue: 120000,
      min: 1000,
      max: 180000,
      advanced: true,
    }),
  },
  async run(context) {
    const response = await contextApiCall<CrawlResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/web/crawl',
      body: buildCrawlRequest({
        url: context.propsValue.url,
        maxPages: context.propsValue.maxPages,
        maxDepth: context.propsValue.maxDepth,
        urlRegex: context.propsValue.urlRegex,
        followSubdomains: context.propsValue.followSubdomains,
        useMainContentOnly: context.propsValue.useMainContentOnly,
        includeLinks: context.propsValue.includeLinks,
        includeImages: context.propsValue.includeImages,
        maxAgeMs: context.propsValue.maxAgeMs,
        waitForMs: context.propsValue.waitForMs,
        stopAfterMs: context.propsValue.stopAfterMs,
        timeoutMs: context.propsValue.timeoutMs,
      }),
    });
    const crawlMetadata = flattenRecord(response.metadata, 'crawl');

    return response.results.map((result) => ({
      url: result.metadata.url,
      title: result.metadata.title,
      crawl_depth: result.metadata.crawlDepth,
      status_code: result.metadata.statusCode,
      success: result.metadata.success,
      markdown: result.markdown,
      ...flattenRecord(result.metadata, 'metadata'),
      ...crawlMetadata,
    }));
  },
});

export function buildCrawlRequest(
  params: CrawlRequestParams
): Record<string, unknown> {
  return {
    url: params.url,
    maxPages: params.maxPages,
    ...(params.maxDepth !== undefined ? { maxDepth: params.maxDepth } : {}),
    ...(params.urlRegex ? { urlRegex: params.urlRegex } : {}),
    followSubdomains: params.followSubdomains,
    useMainContentOnly: params.useMainContentOnly,
    includeLinks: params.includeLinks,
    includeImages: params.includeImages,
    maxAgeMs: params.maxAgeMs,
    waitForMs: params.waitForMs,
    stopAfterMs: params.stopAfterMs,
    timeoutMS: params.timeoutMs,
  };
}

type CrawlResponse = {
  results: CrawlResult[];
  metadata: Record<string, unknown>;
};

type CrawlResult = {
  markdown: string;
  metadata: {
    url: string;
    title: string;
    crawlDepth: number;
    statusCode: number;
    success: boolean;
    [key: string]: unknown;
  };
};

type CrawlRequestParams = {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  urlRegex?: string;
  followSubdomains?: boolean;
  useMainContentOnly?: boolean;
  includeLinks?: boolean;
  includeImages?: boolean;
  maxAgeMs?: number;
  waitForMs?: number;
  stopAfterMs?: number;
  timeoutMs?: number;
};
