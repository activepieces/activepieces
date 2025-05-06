import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';
import { DUMPLING_API_URL } from '../common/constants';

export const scrapeWebsite = createAction({
  name: 'scrape_website',
  auth: dumplingAuth,
  displayName: 'Scrape Website',
  description: 'Extract specific data from a given URL',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
      description: 'The URL of the webpage to scrape',
    }),
    selector: Property.ShortText({
      displayName: 'CSS Selector',
      required: false,
      description: 'Optional CSS selector to target specific elements (leave empty for full page content)',
    }),
    extractionPrompt: Property.LongText({
      displayName: 'Extraction Prompt',
      required: false,
      description: 'Specific instructions about what data to extract',
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      defaultValue: 'markdown',
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
          { label: 'HTML', value: 'html' },
          { label: 'Screenshot', value: 'screenshot' },
        ],
      },
      description: 'Format for the extracted data',
    }),
    cleaned: Property.Checkbox({
      displayName: 'Clean Output',
      required: false,
      defaultValue: true,
      description: 'Whether to clean the output by removing ads, navigation, etc.',
    }),
    renderJs: Property.Checkbox({
      displayName: 'Render JavaScript',
      required: false,
      defaultValue: true,
      description: 'Whether to render JavaScript before scraping (useful for dynamic content)',
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      url, 
      selector, 
      extractionPrompt, 
      format,
      cleaned,
      renderJs
    } = propsValue;

    const requestBody: Record<string, any> = {
      url
    };

    // Add optional parameters if provided
    if (selector) requestBody['selector'] = selector;
    if (extractionPrompt) requestBody['extractionPrompt'] = extractionPrompt;
    if (format) requestBody['format'] = format;
    if (cleaned !== undefined) requestBody['cleaned'] = cleaned;
    if (renderJs !== undefined) requestBody['renderJs'] = renderJs;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DUMPLING_API_URL}/scrape`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 