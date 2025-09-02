import { createAction } from '@activepieces/pieces-framework';
import { scrape_props } from '../common/props';
import { makeRequest } from '../common/requests';
import { validate_props } from '../common/validations';

export const scrapeUrl = createAction({
  name: 'scrape_url',
  displayName: 'Scrape URL',
  description: 'Scrape content from a page using selectors.',
  props: scrape_props,
  async run(context) {
    // Add validation
    await validate_props.scrape_url(context.propsValue);

    const url = context.propsValue.page_url;
    let elements = context.propsValue.css_selectors;
    const waitForSelector = context.propsValue.wait_for_selector;
    const token = context.auth as string;

    // Handle case where elements might be a stringified JSON
    if (typeof elements === 'string') {
      try {
        elements = JSON.parse(elements);
      } catch (e) {
        throw new Error('Invalid JSON format for css_selectors. Expected format: [{"selector": "h1"}, {"selector": ".class"}]');
      }
    }

    // Ensure elements is an array
    if (!Array.isArray(elements)) {
      throw new Error('css_selectors must be an array of objects with selector property');
    }

    const body: any = { url, elements };
    if (waitForSelector) {
      body.waitForSelector = { selector: waitForSelector };
    }

    const response = await makeRequest('/scrape', token, body);
    const result = await response.json();
    return result;
  }
});
