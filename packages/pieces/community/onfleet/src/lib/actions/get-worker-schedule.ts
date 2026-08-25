import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getWorkerSchedule = createAction({
  auth: onfleetAuth,
  name: 'get_worker_schedule',
  displayName: 'Get Worker Schedule',
  description: "Get an existing worker's schedule",
  audience: 'both',
  aiMetadata: {
    description:
      "Retrieve a specific Onfleet worker's schedule, selected by worker. Read-only and idempotent. Use to check a worker's scheduled shifts/availability.",
    idempotent: true,
  },
  props: {
    worker: common.worker,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.workers.getSchedule(
      context.propsValue.worker as string
    );
  },
});
