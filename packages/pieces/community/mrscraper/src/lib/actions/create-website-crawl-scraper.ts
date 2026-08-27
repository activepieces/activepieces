import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const createWebsiteCrawlScraper = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_create_website_crawl_scraper',
  classification: 'WRITE',
  displayName: 'Create Website Crawl Scraper',
  description: 'Creates a reusable Map AI scraper for website URL discovery.',
  audience: 'both',
  aiMetadata: { description: 'Create reusable website crawl configuration with depth, page, result, and URL-pattern controls. Use Crawl Website URLs for immediate discovery. Each call creates new external state and is not idempotent.', idempotent: false },
  props: mrscraperProperties.map,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.map(context.propsValue) });
  },
});
