import { medullarAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { getUserSpaces } from '../common';

export const listSpaces = createAction({
  auth: medullarAuth,
  name: 'listSpaces',
  displayName: 'List Spaces',
  description: 'List all user Spaces',
  props: {},
  async run(context) {
    const spaceListResponse = await getUserSpaces(context.auth);
    return spaceListResponse;
  },
});
