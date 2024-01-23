import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const getWorkerSchedule = createAction({
  auth: onfleetAuth,
  name: 'get_worker_schedule',
  displayName: 'Get Worker Schedule',
  description: "Get an existing worker's schedule",
  props: {
    worker: common.worker,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.workers.getSchedule(
      context.propsValue.worker as string
    );
  },
});
