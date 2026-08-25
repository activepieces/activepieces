import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteShortlinkAction = createAction({
  name: 'delete_shortlink',
  displayName: 'Delete Shortlink',
  description: 'Delete an existing shortlink',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a Zoo shortlink identified by its key. Destructive; the first call removes the link and later calls for the same key have no further effect. Requires the exact shortlink key.', idempotent: false },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
