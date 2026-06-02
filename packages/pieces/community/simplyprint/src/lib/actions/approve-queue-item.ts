import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const approveQueueItemAction = createAction({
  auth: simplyprintAuth,
  name: 'approve_queue_item',
  displayName: 'Approve Queue Item',
  description: 'Approve one or more pending queue items.',
  props: {
    queueItemIds: Property.Array({
      displayName: 'Queue item IDs',
      description: 'Numeric IDs of pending queue items to approve.',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      required: false,
    }),
  },
  async run(context) {
    // queue/approval/ApproveItem splits inputs: `job` / `jobs` (CSV) live on
    // $this->GET (get_validation), `comment` lives on $this->POST.
    const ids = (context.propsValue.queueItemIds ?? []).map(Number);
    if (ids.length === 0) throw new Error('Provide at least one queue item ID.');

    const body: Record<string, unknown> = {};
    if (context.propsValue.comment) body['comment'] = context.propsValue.comment;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/approval/ApproveItem',
      queryParams: { jobs: ids.join(',') },
      body,
    });
  },
});
