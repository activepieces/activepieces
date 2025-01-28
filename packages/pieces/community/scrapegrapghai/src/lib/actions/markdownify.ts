import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { scrapegraphaiAuth } from '../../index';

export const markdownify = createAction({
  name: 'markdownify',
  displayName: 'Convert to Markdown',
  description: 'Convert any webpage into clean, readable Markdown format.',
  auth: scrapegraphaiAuth,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to convert to Markdown',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.scrapegraphai.com/v1/markdownify',
      headers: {
        'Content-Type': 'application/json',
        'SGAI-APIKEY': auth,
      },
      body: {
        website_url: propsValue.website_url,
      },
    });

    return response.body;
  },
}); 