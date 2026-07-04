import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const deleteQueueGroupAction = createAction({
  auth: simplyprintAuth,
  name: 'delete_queue_group',
  displayName: 'Delete Queue Group',
  description:
    'Delete a queue group. Items in the group are moved to "Move to" group, or to the first remaining group if not specified, or set to ungrouped if it was the last group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a queue group by its numeric ID and re-homes its items: to an optional "move to" target group if given, otherwise the first remaining group, or ungrouped if it was the last group. Use to remove a grouping while keeping its queue items. Idempotent in effect: the end state is the same once the group no longer exists.',
    idempotent: true,
  },
  props: {
    groupId: Property.Number({
      displayName: 'Group ID',
      description: 'Numeric ID of the queue group to delete.',
      required: true,
    }),
    moveTo: Property.Number({
      displayName: 'Move items to (optional)',
      description: 'Optional target group ID for orphaned items. If omitted, items go to the first remaining group (or become ungrouped if this is the last).',
      required: false,
    }),
  },
  async run(context) {
    // queue/groups/Delete reads `id` from $this->GET (get_validation),
    // optional `move_to` from $this->POST.
    const body: Record<string, unknown> = {};
    if (typeof context.propsValue.moveTo === 'number' && context.propsValue.moveTo > 0) {
      body['move_to'] = context.propsValue.moveTo;
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/groups/Delete',
      queryParams: { id: String(context.propsValue.groupId) },
      body,
    });
  },
});
