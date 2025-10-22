import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';

export const addWebsite = createAction({
  auth: aidbaseAuth,
  name: 'add_website',
  displayName: 'Add Website',
  description: 'Adds a website URL as a knowledge source for Aidbase.',

  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description:
        'The URL of the website to add as a knowledge source (e.g., https://www.example.com).',
      required: true,
    }),
  },

  async run(context) {
    const { auth: apiKey, propsValue } = context;
    const { website_url } = propsValue;

    return await aidbaseClient.addWebsite(apiKey, website_url);
  },
});
