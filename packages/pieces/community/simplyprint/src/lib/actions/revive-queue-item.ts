import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const reviveQueueItemAction = createAction({
  auth: simplyprintAuth,
  name: 'revive_queue_item',
  displayName: 'Revive Queue Item',
  description: 'Bring a completed (done) queue item back to the active queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Move a previously-completed queue item back into the active print queue by its numeric ID. Pick this to re-print or re-process a job that was already marked done; it changes queue state, so re-running it after the item is already active has no further effect.',
    idempotent: false,
  },
  props: {
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      description: 'Numeric queue item ID. Typically piped in from an upstream step.',
      required: true,
    }),
  },
  async run(context) {
    // queue/ReviveItem reads `job` from $this->GET only.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/ReviveItem',
      queryParams: { job: String(context.propsValue.queueItemId) },
    });
  },
});
