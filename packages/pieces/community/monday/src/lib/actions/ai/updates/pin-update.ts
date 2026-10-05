import { createAction, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { pinUpdateActionOutputSchema } from '../../../output-schemas';

export const pinUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_pin_update',
  classification: 'WRITE',
  displayName: 'Pin Update',
  description: 'Pins an update to the top of its item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pin a monday.com update to the top of its item\'s update feed so it stays visible. Undo with Unpin Update. Pinning an already-pinned update leaves it pinned, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: pinUpdateActionOutputSchema,
  props: {
    update_id: mondayAiProps.updateId(true),
    item_id: mondayAiProps.itemId(false),
  },
  async run(context) {
    const { update_id, item_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ pin_to_top: { id: string; item_id: string | null } }>({
      query: `mutation ($id: ID!, $itemId: ID) {
        pin_to_top(id: $id, item_id: $itemId) { id item_id }
      }`,
      variables: { id: update_id, ...(isNil(item_id) ? {} : { itemId: item_id }) },
    });

    return { id: data.pin_to_top.id, item_id: data.pin_to_top.item_id ?? null, pinned: true };
  },
});
