import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const crawlWebsiteUrls = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_crawl_website_urls',
  classification: 'SEARCH',
  displayName: 'Crawl Website URLs',
  description: 'Immediately discovers URLs by crawling links from one starting website.',
  audience: 'both',
  aiMetadata: { description: 'Crawl a website now to discover matching URLs. Use Create Website Crawl Scraper when the configuration should be reusable. Each call starts a new crawl, so do not retry blindly.', idempotent: false },
  props: mrscraperProperties.map,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.map(context.propsValue) });
  },
});
