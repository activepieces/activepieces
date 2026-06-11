import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateShortlinkAction = createAction({
  name: 'update_shortlink',
  displayName: 'Update Shortlink',
  description: 'Update an existing shortlink',
  audience: 'both',
  aiMetadata: { description: 'Change the destination URL of an existing Zoo shortlink, identified by its key. Idempotent: re-applying the same key and URL leaves the shortlink unchanged. Use the create shortlink action to make a new one instead.', idempotent: true },
  auth: zooAuth,
  // category: 'Shortlinks',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      required: true,
      description: 'The key of the shortlink to update',
    }),
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
      description: 'The new URL for the shortlink',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.zoo.dev/user/shortlinks/${propsValue.key}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        url: propsValue.url,
      },
    });
    return response.body;
  },
});
