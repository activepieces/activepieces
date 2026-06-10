import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { QueueItem } from '../common/types';

export const getQueueItemAction = createAction({
  auth: simplyprintAuth,
  name: 'get_queue_item',
  displayName: 'Get Queue Item',
  description: 'Fetch a single queue item by numeric ID — returns the formatted record (file metadata, assignments, custom fields, …).',
  props: {
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      description: 'Numeric queue item ID. Typically piped in from an upstream step.',
      required: true,
    }),
  },
  async run(context) {
    // queue/GetItem reads `id` from $this->GET (get_validation).
    const res = await simplyprintClient.simplyprintCall<{ item: QueueItem }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'queue/GetItem',
      queryParams: { id: String(context.propsValue.queueItemId) },
    });
    return res.item ?? null;
  },
});
