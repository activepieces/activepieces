import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const denyQueueItemAction = createAction({
  auth: simplyprintAuth,
  name: 'deny_queue_item',
  displayName: 'Deny Queue Item',
  description: 'Deny a pending queue item (remove or send back for revision).',
  props: {
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Explain why the item is being denied. Shown to the submitter.',
      required: true,
    }),
    requestRevision: Property.Checkbox({
      displayName: 'Request revision',
      description: 'When checked, the submitter can edit and resubmit. Otherwise the item is removed.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // queue/approval/DenyItem reads `job` from $this->GET; `comment` and
    // `remove` from $this->POST. Backend semantic: `remove:true` deletes
    // the item, `remove:false` (default) keeps it as DENIED so the
    // submitter can revise. So our "request revision" toggle is the
    // inverse of `remove`.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/approval/DenyItem',
      queryParams: { job: String(context.propsValue.queueItemId) },
      body: {
        comment: context.propsValue.comment,
        remove: !(context.propsValue.requestRevision ?? false),
      },
    });
  },
});
