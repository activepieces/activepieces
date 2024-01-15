import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getDelegateeDetails = createAction({
  auth: onfleetAuth,
  name: 'get_delegatee_details',
  displayName: 'Get Delegatee Details',
  description: 'Get details of a connected organization',
  props: {
    organization: Property.ShortText({
      displayName: 'Organization ID',
      description: 'ID of the connected organization',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.organization.get(context.propsValue.organization);
  },
});
