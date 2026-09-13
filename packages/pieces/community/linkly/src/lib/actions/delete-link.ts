import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall } from '../common/client';
import { linkDropdown, workspaceDropdown } from '../common/props';

export const deleteLink = createAction({
  auth: linklyAuth,
  name: 'delete_link',
  displayName: 'Delete Link',
  description: 'Delete a short link. The short URL stops redirecting immediately.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a Linkly link by ID. The short URL stops working and the link moves to the workspace trash, from where it can be restored in the Linkly dashboard. Idempotent: deleting an already-deleted link is a no-op error.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
    id: linkDropdown,
  },
  async run({ auth, propsValue }) {
    const { workspace_id, id } = propsValue;
    await linklyApiCall({
      token: auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/workspace/${workspace_id}/links/${id}`,
    });
    return { success: true, id };
  },
});
