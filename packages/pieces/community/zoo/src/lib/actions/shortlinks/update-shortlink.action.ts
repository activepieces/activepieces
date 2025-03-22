import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateShortlinkAction = createAction({
  name: 'update_shortlink',
  displayName: 'Update Shortlink',
  description: 'Update an existing shortlink',
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
        Authorization: `Bearer ${auth}`,
      },
      body: {
        url: propsValue.url,
      },
    });
    return response.body;
  },
});
