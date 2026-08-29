import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { contextDevAuth } from '../auth';
import {
  contextApiCall,
  flattenRecord,
  toQueryParams,
  toStringArray,
} from '../common/client';

export const scrapeUrl = createAction({
  name: 'scrape_url',
  classification: 'READ',
  displayName: 'Scrape URL',
  description: 'Convert a web page into clean Markdown.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve one known URL as clean Markdown. Use this after a URL is already known; use Search Web to discover pages or Crawl Website to retrieve multiple linked pages.',
    idempotent: true,
  },
  auth: contextDevAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'Full HTTP or HTTPS URL to scrape, such as https://www.context.dev/pricing.',
      required: true,
      placeholder: 'https://www.context.dev/pricing',
    }),
    useMainContentOnly: Property.Checkbox({
      displayName: 'Main Content Only',
      description: 'Remove navigation, headers, footers, and sidebars.',
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
    includeHtml: Property.Checkbox({
      displayName: 'Include HTML',
      description: 'Return the source HTML alongside Markdown.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    includeFrames: Property.Checkbox({
      displayName: 'Include Frames',
      description: 'Render iframe contents into the returned page content.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    includeSelectors: Property.Array({
      displayName: 'Include Selectors',
      description:
        'Only keep content matching these CSS selectors, such as article or #pricing.',
      required: false,
      advanced: true,
    }),
    excludeSelectors: Property.Array({
      displayName: 'Exclude Selectors',
      description:
        'Remove content matching these CSS selectors, such as nav or .cookie-banner.',
      required: false,
      advanced: true,
    }),
    maxAgeMs: Property.Number({
      displayName: 'Cache Maximum Age',
      description:
        'Maximum cache age in milliseconds. Use 0 to force a fresh scrape.',
      required: false,
      defaultValue: 86400000,
      min: 0,
      max: 2592000000,
      advanced: true,
    }),
    waitForMs: Property.Number({
      displayName: 'Wait After Load',
      description:
        'Extra wait after page load in milliseconds, from 0 to 30000.',
      required: false,
      min: 0,
      max: 30000,
      advanced: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Two-letter ISO country code for the browser location, such as us, gb, or de.',
      required: false,
      placeholder: 'us',
      advanced: true,
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
    const response = await contextApiCall<ScrapeResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/web/scrape/markdown',
      queryParams: buildScrapeQuery({
        url: context.propsValue.url,
        useMainContentOnly: context.propsValue.useMainContentOnly,
        includeLinks: context.propsValue.includeLinks,
        includeImages: context.propsValue.includeImages,
        includeHtml: context.propsValue.includeHtml,
        includeFrames: context.propsValue.includeFrames,
        includeSelectors: context.propsValue.includeSelectors,
        excludeSelectors: context.propsValue.excludeSelectors,
        maxAgeMs: context.propsValue.maxAgeMs,
        waitForMs: context.propsValue.waitForMs,
        country: context.propsValue.country,
        timeoutMs: context.propsValue.timeoutMs,
      }),
    });

    return {
      success: response.success,
      url: response.url,
      markdown: response.markdown,
      html: response.html ?? null,
      content_length: response.contentLength,
      ...flattenRecord(response.metadata, 'metadata'),
    };
  },
});

export function buildScrapeQuery(
  params: ScrapeQueryParams
): Record<string, string> {
  const includeSelectors = toStringArray(params.includeSelectors);
  const excludeSelectors = toStringArray(params.excludeSelectors);

  return {
    ...toQueryParams({
      url: params.url,
      useMainContentOnly: params.useMainContentOnly,
      includeLinks: params.includeLinks,
      includeImages: params.includeImages,
      includeHTML: params.includeHtml,
      includeFrames: params.includeFrames,
      maxAgeMs: params.maxAgeMs,
      waitForMs: params.waitForMs,
      country: params.country,
      timeoutMS: params.timeoutMs,
    }),
    ...(includeSelectors.length > 0
      ? { includeSelectors: includeSelectors.join(',') }
      : {}),
    ...(excludeSelectors.length > 0
      ? { excludeSelectors: excludeSelectors.join(',') }
      : {}),
  };
}

type ScrapeResponse = {
  success: boolean;
  markdown: string;
  html?: string;
  contentLength: number;
  url: string;
  metadata: Record<string, unknown>;
};

type ScrapeQueryParams = {
  url: string;
  useMainContentOnly?: boolean;
  includeLinks?: boolean;
  includeImages?: boolean;
  includeHtml?: boolean;
  includeFrames?: boolean;
  includeSelectors?: unknown;
  excludeSelectors?: unknown;
  maxAgeMs?: number;
  waitForMs?: number;
  country?: string;
  timeoutMs?: number;
};
