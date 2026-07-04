import { medullarAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { getUserSpaces } from '../common';

export const listSpaces = createAction({
  auth: medullarAuth,
  name: 'listSpaces',
  displayName: 'List Spaces',
  description: 'List all user Spaces',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all Medullar Spaces belonging to the authenticated user. Use to discover available Spaces and their UUIDs before targeting one in another action (add record, ask, rename, delete). Read-only and idempotent; takes no input.', idempotent: true },
  props: {},
  async run(context) {
    const spaceListResponse = await getUserSpaces(context.auth);
    return spaceListResponse;
  },
});
