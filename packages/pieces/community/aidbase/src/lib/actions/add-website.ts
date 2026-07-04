import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';

export const addWebsite = createAction({
  auth: aidbaseAuth,
  name: 'add_website',
  displayName: 'Add Website',
  description: 'Adds a website URL as a knowledge source for Aidbase.',
  audience: 'both',
  aiMetadata: {
    description:
      'Registers a website URL as a new knowledge source in Aidbase so its content can later be trained on and answered from. Use when ingesting a web page or site into the knowledge base; requires the website URL. Not idempotent: each call creates a new knowledge source even for the same URL.',
    idempotent: false,
  },

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

    return await aidbaseClient.addWebsite(apiKey.secret_text, website_url);
  },
});
