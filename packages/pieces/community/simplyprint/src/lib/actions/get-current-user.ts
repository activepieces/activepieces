import { createAction } from '@activepieces/pieces-framework';

import { simplyprintAuth, simplyprintSession } from '../auth';

export const getCurrentUserAction = createAction({
  auth: simplyprintAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Return information about the SimplyPrint account connected to this flow.',
  props: {},
  async run(context) {
    return await simplyprintSession.resolveSession(context.auth);
  },
});
