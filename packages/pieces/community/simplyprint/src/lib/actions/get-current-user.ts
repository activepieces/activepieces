import { createAction } from '@activepieces/pieces-framework';

import { simplyprintAuth, simplyprintSession } from '../auth';

export const getCurrentUserAction = createAction({
  auth: simplyprintAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Return information about the SimplyPrint account connected to this flow.',
  audience: 'both',
  aiMetadata: { description: 'Look up the SimplyPrint account, company, and user identity behind the current connection. Read-only; pick it to resolve who the flow is acting as or to discover the account/company ID needed by other steps. Takes no inputs.', idempotent: true },
  props: {},
  async run(context) {
    return await simplyprintSession.resolveSession(context.auth);
  },
});
