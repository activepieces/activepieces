import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getHubs = createAction({
  auth: onfleetAuth,
  name: 'get_hubs',
  displayName: 'Get Hubs',
  description: 'Get many hubs',
  audience: 'both',
  aiMetadata: { description: 'Lists all hubs (physical depots/locations) in the Onfleet organization. Read-only and idempotent, taking no input. Use it to discover hub IDs before assigning a hub to a team or worker.', idempotent: true },
  props: {},
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.hubs.get();
  },
});
