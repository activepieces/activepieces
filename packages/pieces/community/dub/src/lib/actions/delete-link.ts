import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';

export const deleteLink = createAction({
  name: 'delete_link',
  displayName: 'Delete Link',
  description: 'Permanently delete a Dub link. This action cannot be undone.',
  auth: dubAuth,
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the link to delete (e.g. `clv3g2...`). Find this from the Create Link or List Links actions.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.DELETE,
      url: `${DUB_API_BASE}/links/${propsValue.linkId}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
