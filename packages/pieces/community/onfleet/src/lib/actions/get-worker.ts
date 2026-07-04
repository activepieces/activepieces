import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getWorker = createAction({
  auth: onfleetAuth,
  name: 'get_worker',
  displayName: 'Get Worker',
  description: "Get an existing worker's details",
  audience: 'both',
  aiMetadata: { description: "Fetches a single Onfleet worker (driver) by worker ID. Read-only and idempotent. Requires a known worker ID; there is no list-all-workers action in this set, so obtain the ID from another source first.", idempotent: true },
  props: {
    worker: common.worker,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.workers.get(context.propsValue.worker as string);
  },
});
