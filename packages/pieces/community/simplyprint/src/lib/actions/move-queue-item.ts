import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const moveQueueItemAction = createAction({
  auth: simplyprintAuth,
  name: 'move_queue_item',
  displayName: 'Move Queue Item',
  description: 'Move a queue item to a different queue group.',
  props: {
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      description: 'Numeric queue item ID. Typically piped in from an upstream step.',
      required: true,
    }),
    targetGroupId: Property.Number({
      displayName: 'Target queue group ID',
      description: 'Numeric ID of the destination queue group.',
      required: true,
    }),
  },
  async run(context) {
    // queue/MoveItem reads both `jobs` (comma-separated string) and `moveTo`
    // from $this->GET — body params are ignored. We send a single id, so
    // a comma-separated list of one is fine.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/MoveItem',
      queryParams: {
        jobs: String(context.propsValue.queueItemId),
        moveTo: String(context.propsValue.targetGroupId),
      },
    });
  },
});
