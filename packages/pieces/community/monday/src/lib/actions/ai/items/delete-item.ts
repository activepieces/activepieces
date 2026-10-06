import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { deleteItemActionOutputSchema } from '../../../output-schemas';

export const deleteItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_item',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Item',
  description: 'Deletes an item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a monday.com item or subitem; it moves to the account trash and cannot be restored through the API. Prefer Archive Item when the item may be needed later. A retry on an already-deleted item fails.',
    idempotent: false,
  },
  outputSchema: deleteItemActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ delete_item: { id: string } | null }>({
      query: `mutation ($itemId: ID!) {
        delete_item(item_id: $itemId) { id }
      }`,
      variables: { itemId: context.propsValue.item_id },
    });

    return {
      success: true,
      id: data.delete_item?.id ?? context.propsValue.item_id,
    };
  },
});
