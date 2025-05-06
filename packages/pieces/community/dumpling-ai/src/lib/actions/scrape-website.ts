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
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      description: 'Format for the extracted data',
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { url, selector, extractionPrompt, outputFormat } = propsValue;

    const requestBody: Record<string, any> = {
      url
    };

    // Add optional parameters if provided
    if (selector) requestBody['selector'] = selector;
    if (extractionPrompt) requestBody['extractionPrompt'] = extractionPrompt;
    if (outputFormat) requestBody['outputFormat'] = outputFormat;

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