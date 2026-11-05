import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';
import { scrapelessUtils } from '../../common/utils';

const { stringList } = scrapelessUtils;

export const batchScrapeUrlsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_batch_scrape_urls',
  displayName: 'Batch Scrape URLs',
  description: 'Starts a batch job that scrapes several webpages.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a batch job that scrapes a list of webpages with the same options and returns the batch id. Poll Get Batch Scrape Status for the pages, Get Batch Scrape Errors for failures, and Cancel Batch Scrape to stop it. Each page uses credits.',
    idempotent: false,
  },
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description:
        'The pages to scrape, e.g. ["https://example.com/a", "https://example.com/b"].',
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
    const urls = stringList({ value: propsValue.urls, prop: 'URLs' });
    if (!urls || urls.length === 0) {
      throw new Error('URLs must contain at least one URL.');
    }
    return await scrapelessApi.startBatchScrape({
      auth,
      urls,
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
