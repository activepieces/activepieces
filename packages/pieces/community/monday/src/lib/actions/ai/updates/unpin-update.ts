import { createAction, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { unpinUpdateActionOutputSchema } from '../../../output-schemas';

export const unpinUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_unpin_update',
  classification: 'WRITE',
  displayName: 'Unpin Update',
  description: 'Unpins an update from the top of its item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unpin a monday.com update from the top of its item\'s update feed, reversing Pin Update. Unpinning an update that is not pinned leaves it unchanged, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: unpinUpdateActionOutputSchema,
  props: {
    update_id: mondayAiProps.updateId(true),
    item_id: mondayAiProps.itemId(false),
  },
  async run(context) {
    const { update_id, item_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ unpin_from_top: { id: string; item_id: string | null } }>({
      query: `mutation ($id: ID!, $itemId: ID) {
        unpin_from_top(id: $id, item_id: $itemId) { id item_id }
      }`,
      variables: { id: update_id, ...(isNil(item_id) ? {} : { itemId: item_id }) },
    });

    return { id: data.unpin_from_top.id, item_id: data.unpin_from_top.item_id ?? null, pinned: false };
  },
});
