import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getOrganization = createAction({
  auth: onfleetAuth,
  name: 'get_organization',
  displayName: 'Get Organization',
  description: 'Get your organization details',
  props: {},
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.organization.get();
  },
});
