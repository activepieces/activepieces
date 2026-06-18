import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createShortlinkAction = createAction({
  name: 'create_shortlink',
  displayName: 'Create Shortlink',
  description: 'Create a new shortlink for your user account',
  audience: 'both',
  aiMetadata: { description: 'Create a new Zoo shortlink for the authenticated user that redirects to a target URL, optionally with a custom key. Not idempotent: repeated calls create distinct shortlinks (or conflict on a reused custom key). Use the update shortlink action to change an existing link\'s destination.', idempotent: false },
  auth: zooAuth,
  // category: 'Shortlinks',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
      description: 'The URL to shorten',
    }),
    key: Property.ShortText({
      displayName: 'Key',
      required: false,
      description: 'Custom key for the shortlink (optional)',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/user/shortlinks',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        url: propsValue.url,
        ...(propsValue.key && { key: propsValue.key }),
      },
    });
    return response.body;
  },
});
