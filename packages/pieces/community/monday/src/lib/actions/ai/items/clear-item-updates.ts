import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { clearItemUpdatesActionOutputSchema } from '../../../output-schemas';

export const clearItemUpdatesAction = createAction({
  auth: mondayAuth,
  name: 'monday_clear_item_updates',
  classification: 'DESTRUCTIVE',
  displayName: 'Clear Item Updates',
  description: 'Deletes all updates on an item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete every update (comment thread) on a monday.com item. Use Delete Update to remove a single update instead. Irreversible; re-running on an item with no updates is harmless.',
    idempotent: true,
  },
  outputSchema: clearItemUpdatesActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ clear_item_updates: MondayItemSummary }>({
      query: `mutation ($itemId: ID!) {
        clear_item_updates(item_id: $itemId) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: { itemId: context.propsValue.item_id },
    });

    return {
      success: true,
      ...itemCommon.mapItemSummary(data.clear_item_updates),
    };
  },
});
