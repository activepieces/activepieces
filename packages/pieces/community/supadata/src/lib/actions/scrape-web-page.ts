import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataScrapeWebPageOutputSchema } from '../output-schemas';

export const scrapeWebPageAction = createAction({
  name: 'supadata_scrape_web_page',
  outputSchema: supadataScrapeWebPageOutputSchema,
  displayName: 'Scrape Web Page',
  description: 'Extracts the content of a web page as Markdown.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Fetches a web page and returns its content as Markdown with title, description and the links found on it. Use for reading one page; use supadata_start_web_crawl for a whole site. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'URL of the page to scrape.',
      required: true,
    }),
    noLinks: Property.Checkbox({
      displayName: 'Exclude Links',
      description: 'If true, links are stripped from the Markdown.',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Preferred page language (ISO 639-1 code).',
      required: false,
    }),
  },
  async run(context) {
    const { url, noLinks, lang } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/web/scrape',
      query: { url, noLinks, lang },
    });
  },
});
