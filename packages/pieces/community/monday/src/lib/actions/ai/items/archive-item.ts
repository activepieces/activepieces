import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { archiveItemActionOutputSchema } from '../../../output-schemas';

export const archiveItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_archive_item',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Item',
  description: 'Archives an item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archive a monday.com item, removing it from board views while keeping it restorable from the archive. Prefer this over Delete Item unless permanent removal is explicitly wanted. Safe to retry: archiving an archived item is a no-op.',
    idempotent: true,
  },
  outputSchema: archiveItemActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ archive_item: MondayItemSummary }>({
      query: `mutation ($itemId: ID!) {
        archive_item(item_id: $itemId) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: { itemId: context.propsValue.item_id },
    });

    return itemCommon.mapItemSummary(data.archive_item);
  },
});
