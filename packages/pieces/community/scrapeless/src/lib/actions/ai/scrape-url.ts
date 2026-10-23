import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';
import { scrapelessUtils } from '../../common/utils';

const { stringList } = scrapelessUtils;

export const scrapeUrlAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_scrape_url',
  displayName: 'Scrape URL',
  description:
    'Starts a scrape of one webpage into markdown, HTML, links or a screenshot.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a scrape of a single webpage and returns the scrape id; read the content (markdown, HTML, links or screenshot) with Get Scrape Status once it completes. Use Batch Scrape URLs for many pages, Start Crawl to follow links, or Unlock Webpage for heavily protected pages.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The page to scrape, e.g. "https://example.com/blog".',
      required: true,
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
    return await scrapelessApi.startScrape({
      auth,
      url: propsValue.url,
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
