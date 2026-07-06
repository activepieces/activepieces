import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getOrganization = createAction({
  auth: onfleetAuth,
  name: 'get_organization',
  displayName: 'Get Organization',
  description: 'Get your organization details',
  audience: 'both',
  aiMetadata: { description: "Fetches details of your own Onfleet organization (the one owning the API key). Read-only and idempotent, taking no input. To read a connected/partner organization instead, use get-delegatee-details with its organization ID.", idempotent: true },
  props: {},
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.organization.get();
  },
});
