import { createAction, Property } from '@ensemble/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@ensemble/pieces-common';

export const deleteShortlinkAction = createAction({
  name: 'delete_shortlink',
  displayName: 'Delete Shortlink',
  description: 'Delete an existing shortlink',
  auth: zooAuth,
  // category: 'Shortlinks',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      required: true,
      description: 'The key of the shortlink to delete',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.zoo.dev/user/shortlinks/${propsValue.key}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
