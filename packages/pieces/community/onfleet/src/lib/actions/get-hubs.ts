import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getHubs = createAction({
  auth: onfleetAuth,
  name: 'get_hubs',
  displayName: 'Get Hubs',
  description: 'Get many hubs',
  props: {},
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.hubs.get();
  },
});
