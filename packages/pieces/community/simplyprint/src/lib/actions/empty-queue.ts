import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintProps } from '../common/props';

export const emptyQueueAction = createAction({
  auth: simplyprintAuth,
  name: 'empty_queue',
  displayName: 'Empty Queue',
  description: 'Delete every item from the print queue (optionally filtered to a group or done-only). Destructive.',
  audience: 'both',
  aiMetadata: { description: 'Bulk-delete print-queue items, optionally scoped to a single queue group and/or restricted to only completed items. Destructive and irreversible — prefer the single-item delete/move tools unless a full clear is intended. Idempotent in effect: re-running on an already-empty queue is a no-op.', idempotent: true },
  props: {
    groupId: simplyprintProps.queueGroupDropdown({ required: false }),
    doneOnly: Property.Checkbox({
      displayName: 'Only remove completed items',
      description: 'When checked, only done items are removed. Pending / printing / failed items stay.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // queue/EmptyQueue's post_validation field is `done_items` — not
    // `done_only`. The wrong name was being silently dropped, so the
    // toggle never had any effect.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/EmptyQueue',
      body: {
        group: context.propsValue.groupId ?? null,
        done_items: context.propsValue.doneOnly ?? false,
      },
    });
  },
});
