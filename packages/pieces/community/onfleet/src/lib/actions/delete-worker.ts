import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const deleteWorker = createAction({
  auth: onfleetAuth,
  name: 'delete_worker',
  displayName: 'Delete Worker',
  description: 'Delete an existing worker',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes an Onfleet worker (driver) by worker ID. Destructive and not reversible; deleting an already-removed worker will error rather than be a no-op. Requires a known worker ID.', idempotent: false },
  props: {
    worker: common.worker,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.workers.deleteOne(
      context.propsValue.worker as string
    );
  },
});
