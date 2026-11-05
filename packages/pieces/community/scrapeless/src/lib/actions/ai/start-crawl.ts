import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';
import { scrapelessUtils } from '../../common/utils';

const { stringList } = scrapelessUtils;

export const startCrawlAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_start_crawl',
  displayName: 'Start Crawl',
  description:
    'Starts a crawl that follows a website’s links and scrapes each page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a crawl from a URL that follows links within the site and scrapes each page, and returns the crawl id. Poll Get Crawl Status for the pages, Get Crawl Errors for failures, and Cancel Crawl to stop it. Each page uses credits, so set Limit.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Start URL',
      description: 'Where the crawl starts, e.g. "https://example.com".',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pages to crawl.',
      required: false,
    }),
    maxDepth: Property.Number({
      displayName: 'Max Depth',
      description: 'Maximum link depth from the start URL.',
      required: false,
    }),
    includePaths: scrapelessAiProps.tags({
      required: false,
      displayName: 'Include Paths',
      description:
        'Only crawl URLs whose path matches these regex patterns, e.g. ["^/blog/.*"].',
    }),
    excludePaths: scrapelessAiProps.tags({
      required: false,
      displayName: 'Exclude Paths',
      description:
        'Skip URLs whose path matches these regex patterns, e.g. ["^/admin/.*"].',
    }),
    allowExternalLinks: Property.Checkbox({
      displayName: 'Allow External Links',
      description: 'Also follow links to other domains.',
      required: false,
    }),
    ignoreSitemap: Property.Checkbox({
      displayName: 'Ignore Sitemap',
      description: 'Don’t use the site’s sitemap to discover pages.',
      required: false,
    }),
    formats: scrapelessAiProps.formats({ required: false }),
    onlyMainContent: scrapelessAiProps.onlyMainContent({ required: false }),
    includeTags: scrapelessAiProps.tags({
      required: false,
      displayName: 'Include Tags',
      description:
        'Only keep these HTML tags or selectors, e.g. ["article", ".content"].',
    }),
    excludeTags: scrapelessAiProps.tags({
      required: false,
      displayName: 'Exclude Tags',
      description: 'Drop these HTML tags or selectors, e.g. ["nav", ".ads"].',
    }),
    waitFor: scrapelessAiProps.waitFor({ required: false }),
    proxyCountry: scrapelessAiProps.proxyCountry({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.startCrawl({
      auth,
      url: propsValue.url,
      crawl: {
        limit: propsValue.limit,
        maxDepth: propsValue.maxDepth,
        includePaths: stringList({
          value: propsValue.includePaths,
          prop: 'Include Paths',
        }),
        excludePaths: stringList({
          value: propsValue.excludePaths,
          prop: 'Exclude Paths',
        }),
        allowExternalLinks: propsValue.allowExternalLinks,
        ignoreSitemap: propsValue.ignoreSitemap,
      },
      options: {
        formats: propsValue.formats,
        onlyMainContent: propsValue.onlyMainContent,
        includeTags: stringList({
          value: propsValue.includeTags,
          prop: 'Include Tags',
        }),
        excludeTags: stringList({
          value: propsValue.excludeTags,
          prop: 'Exclude Tags',
        }),
        waitFor: propsValue.waitFor,
      },
      browserOptions: { proxy_country: propsValue.proxyCountry },
    });
  },
});
