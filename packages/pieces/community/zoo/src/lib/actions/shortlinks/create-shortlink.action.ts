import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createShortlinkAction = createAction({
  name: 'create_shortlink',
  displayName: 'Create Shortlink',
  description: 'Create a new shortlink for your user account',
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
        Authorization: `Bearer ${auth}`,
      },
      body: {
        url: propsValue.url,
        ...(propsValue.key && { key: propsValue.key }),
      },
    });
    return response.body;
  },
});
