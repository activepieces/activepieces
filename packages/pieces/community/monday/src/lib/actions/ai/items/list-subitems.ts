import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_WITH_VALUES_FIELDS, itemCommon, MondayItemWithValues } from './item-common';
import { makeClient } from '../../../common';
import { listSubitemsActionOutputSchema } from '../../../output-schemas';

export const listSubitemsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_subitems',
  classification: 'SEARCH',
  displayName: 'List Subitems',
  description: 'Lists the subitems of an item with their column values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List all subitems of a monday.com item with their column values and the subitems board ID (needed to update subitem columns). Use Get Items when you already hold subitem IDs. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listSubitemsActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
    column_ids: Property.Array({
      displayName: 'Column IDs',
      description: 'Only return these subitem column values. Leave empty for all columns.',
      required: false,
    }),
  },
  async run(context) {
    const columnIds = itemCommon.columnIdsVariable(context.propsValue.column_ids);

    const data = await makeClient(context.auth).query<{ items: { id: string; subitems: MondayItemWithValues[] | null }[] }>({
      query: `query ($ids: [ID!], $columnIds: [String!]) {
        items(ids: $ids) {
          id
          subitems { ${ITEM_WITH_VALUES_FIELDS} }
        }
      }`,
      variables: {
        ids: [context.propsValue.item_id],
        ...(columnIds === null ? {} : { columnIds }),
      },
    });

    const parent = data.items[0];
    if (!parent) {
      throw new Error(`Item ${context.propsValue.item_id} was not found or is not accessible.`);
    }

    const subitems = (parent.subitems ?? []).map((subitem) => ({
      ...itemCommon.mapItemWithValues(subitem),
      parent_item_id: parent.id,
    }));
    return { subitems, count: subitems.length };
  },
});
