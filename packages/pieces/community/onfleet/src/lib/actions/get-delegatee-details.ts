import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getDelegateeDetails = createAction({
  auth: onfleetAuth,
  name: 'get_delegatee_details',
  displayName: 'Get Delegatee Details',
  description: 'Get details of a connected organization',
  audience: 'both',
  aiMetadata: { description: 'Fetches details of a connected (delegatee) Onfleet organization by its organization ID. Read-only and idempotent. Use this for a partner/connected org you delegate to; to read your own organization use get-organization instead.', idempotent: true },
  props: {
    organization: Property.ShortText({
      displayName: 'Organization ID',
      description: 'ID of the connected organization',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.organization.get(context.propsValue.organization);
  },
});
