import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { getItemsActionOutputSchema } from '../../../output-schemas';

export const getItemsAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_items',
  classification: 'READ',
  displayName: 'Get Items',
  description: 'Gets one or more items (or subitems) by ID with their column values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch up to 100 monday.com items or subitems by ID, including every column value as text plus raw JSON. Use when you already hold item IDs; to enumerate a board use List Board Items, to find items by a column value use Search Items by Column Values. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getItemsActionOutputSchema,
  props: {
    item_ids: Property.Array({
      displayName: 'Item IDs',
      description: 'Numeric item or subitem IDs (max 100).',
      required: true,
    }),
  },
  async run(context) {
    const ids = mondayApi.toStringArray(context.propsValue.item_ids);
    if (ids.length === 0) {
      throw new Error('Provide at least one item ID.');
    }
    if (ids.length > 100) {
      throw new Error('monday.com accepts at most 100 item IDs per request.');
    }

    const data = await makeClient(context.auth).query<{ items: MondayItem[] }>({
      query: `query ($ids: [ID!]) {
        items(ids: $ids) {
          id
          name
          state
          created_at
          updated_at
          url
          board { id name }
          group { id title }
          parent_item { id }
          column_values { id type text value }
        }
      }`,
      variables: { ids },
    });

    const items = data.items.map((item) => ({
      id: item.id,
      name: item.name,
      state: item.state,
      url: item.url,
      board_id: item.board?.id ?? null,
      board_name: item.board?.name ?? null,
      group_id: item.group?.id ?? null,
      group_title: item.group?.title ?? null,
      parent_item_id: item.parent_item?.id ?? null,
      created_at: item.created_at,
      updated_at: item.updated_at,
      column_values: item.column_values.map((cv) => ({
        column_id: cv.id,
        type: cv.type,
        text: cv.text ?? null,
        value: cv.value ?? null,
      })),
    }));

    return { items, count: items.length };
  },
});

type MondayItem = {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  board: { id: string; name: string } | null;
  group: { id: string; title: string } | null;
  parent_item: { id: string } | null;
  column_values: { id: string; type: string; text: string | null; value: string | null }[];
};
