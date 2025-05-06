import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingaiAuth } from '../../index';
import { BASE_URL, apiHeaders } from '../common/common';

export const scrapeWebsite = createAction({
  name: 'scrape_website',
  displayName: 'Scrape Website',
  description: 'Extract specific data from a given URL',
  auth: dumplingaiAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
      description: 'The URL of the webpage to scrape',
    }),
    selector: Property.ShortText({
      displayName: 'CSS Selector',
      required: false,
      description: 'Optional CSS selector to extract specific elements (leave empty to get all content)',
    }),
    extract_text_only: Property.Checkbox({
      displayName: 'Extract Text Only',
      required: false,
      description: 'Whether to extract only the text content from the page',
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/scrape`,
      headers: apiHeaders(auth),
      body: {
        url: propsValue.url,
        selector: propsValue.selector,
        extract_text_only: propsValue.extract_text_only,
      },
    });

    return response.body;
  },
}); 