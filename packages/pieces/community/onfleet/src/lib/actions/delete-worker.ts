import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const deleteWorker = createAction({
  auth: onfleetAuth,
  name: 'delete_worker',
  displayName: 'Delete Worker',
  description: 'Delete an existing worker',
  props: {
    worker: common.worker,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.workers.deleteOne(
      context.propsValue.worker as string
    );
  },
});
