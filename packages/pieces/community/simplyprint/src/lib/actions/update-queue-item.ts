import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const updateQueueItemAction = createAction({
  auth: simplyprintAuth,
  name: 'update_queue_item',
  displayName: 'Update Queue Item',
  description: 'Update a queue item (amount, note, etc.).',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates editable fields (quantity, note) on an existing queue item identified by its numeric ID. Use to adjust a known queue entry in place; only the fields you pass are changed. Idempotent: applying the same values keyed to the same item ID converges to the same state.',
    idempotent: true,
  },
  props: {
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      description: 'Numeric queue item ID. Typically piped in from an upstream step.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Quantity',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
  },
  async run(context) {
    // queue/UpdateItem splits its inputs across the two scopes: `job`
    // identifies the row and is read from $this->GET (get_validation), the
    // mutating fields (amount, note, etc.) live on $this->POST.
    const body: Record<string, unknown> = {};
    if (context.propsValue.amount !== undefined) body['amount'] = context.propsValue.amount;
    if (context.propsValue.note !== undefined) body['note'] = context.propsValue.note;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/UpdateItem',
      queryParams: { job: String(context.propsValue.queueItemId) },
      body,
    });
  },
});
