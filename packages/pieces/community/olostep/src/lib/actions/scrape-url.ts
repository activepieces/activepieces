import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { olostepAuth } from '../auth';

export const scrapeUrl = createAction({
  auth: olostepAuth,
  name: 'scrapeUrl',
  displayName: 'Scrape URL',
  description: 'Scrape a URL with Olostep.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL to scrape.',
      required: true,
    }),
    format: Property.StaticDropdown<string>({
      displayName: 'Format',
      description: 'Output format to request from Olostep.',
      required: true,
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'Text', value: 'text' },
          { label: 'JSON', value: 'json' },
          { label: 'Raw PDF', value: 'raw_pdf' },
          { label: 'Screenshot', value: 'screenshot' },
        ],
      },
      defaultValue: 'markdown',
    }),
    waitBeforeScraping: Property.Number({
      displayName: 'Wait Before Scraping (ms)',
      description: 'Milliseconds to wait before scraping the page.',
      required: false,
    }),
    removeCssSelectors: Property.Json({
      displayName: 'Remove CSS Selectors',
      description: 'Array of CSS selectors to remove before scraping.',
      required: false,
      defaultValue: [],
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Optional country code to perform the scrape from (e.g., us, de).',
      required: false,
    }),
    actions: Property.Json({
      displayName: 'Actions',
      description: 'Optional browser actions to perform before scraping (wait, click, fill_input, scroll).',
      required: false,
    }),
    llmExtract: Property.Json({
      displayName: 'LLM Extract',
      description: 'Optional LLM extraction config: { schema?: object, prompt?: string }',
      required: false,
    }),
    linksOnPage: Property.Json({
      displayName: 'Links On Page',
      description: 'Optional link extraction configuration (include_links, exclude_links, query_to_order_links_by, absolute_links).',
      required: false,
    }),
    removeImages: Property.Checkbox({
      displayName: 'Remove Images',
      description: 'Remove images from the scraped output.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const apiKey = auth.secret_text;

    const body: Record<string, any> = {
      url_to_scrape: propsValue.url,
      formats: [propsValue.format],
    };

    if (propsValue.waitBeforeScraping !== undefined) {
      body['wait_before_scraping'] = propsValue.waitBeforeScraping;
    }
    if (propsValue.removeCssSelectors !== undefined) {
      body['remove_css_selectors'] = propsValue.removeCssSelectors;
    }
    if (propsValue.country !== undefined) {
      body['country'] = propsValue.country;
    }
    if (propsValue.actions !== undefined) {
      body['actions'] = propsValue.actions;
    }
    if (propsValue.llmExtract !== undefined) {
      body['llm_extract'] = propsValue.llmExtract;
    }
    if (propsValue.linksOnPage !== undefined) {
      body['links_on_page'] = propsValue.linksOnPage;
    }
    if (propsValue.removeImages !== undefined) {
      body['remove_images'] = propsValue.removeImages;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.olostep.com/v1/scrapes',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    return response.body;
  },
});
