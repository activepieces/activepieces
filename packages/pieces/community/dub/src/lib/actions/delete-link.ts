import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';

export const deleteLink = createAction({
  name: 'delete_link',
  displayName: 'Delete Link',
  description: 'Permanently delete a Dub link. This action cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Dub link by its link ID; this is destructive and cannot be undone. Use only when an agent is certain the link should be removed. Idempotent on end state — once deleted the link stays gone — but a repeat call targets an already-removed link.',
    idempotent: true,
  },
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
