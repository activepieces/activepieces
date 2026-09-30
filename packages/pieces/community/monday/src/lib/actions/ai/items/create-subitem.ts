import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { createSubitemActionOutputSchema } from '../../../output-schemas';

export const createSubitemAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_subitem',
  classification: 'WRITE',
  displayName: 'Create Subitem',
  description: 'Creates a subitem under an item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a subitem under a parent monday.com item, optionally with column values as a JSON map of subitem-board column ID to value. Subitems live on a separate subitems board, so their column IDs differ from the parent board; read them with List Subitems or List Columns on that board. Each call creates a new subitem, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createSubitemActionOutputSchema,
  props: {
    parent_item_id: Property.ShortText({
      displayName: 'Parent Item ID',
      description: 'The item to add the subitem under. Resolve it with List Board Items.',
      required: true,
    }),
    item_name: Property.ShortText({
      displayName: 'Subitem Name',
      required: true,
    }),
    column_values: Property.Json({
      displayName: 'Column Values',
      description: 'JSON map of subitem column ID to value, e.g. {"status": {"label": "Working on it"}}.',
      required: false,
    }),
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Labels If Missing',
      description: 'Create missing status/dropdown labels. Requires permission to change the board structure.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { parent_item_id, item_name, column_values, create_labels_if_missing } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_subitem: MondayItemSummary }>({
      query: `mutation ($parentItemId: ID!, $itemName: String!, $columnValues: JSON, $createLabels: Boolean) {
        create_subitem(parent_item_id: $parentItemId, item_name: $itemName, column_values: $columnValues, create_labels_if_missing: $createLabels) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        parentItemId: parent_item_id,
        itemName: item_name,
        ...(isNil(column_values) ? {} : { columnValues: mondayApi.toJsonString(column_values) }),
        createLabels: create_labels_if_missing ?? false,
      },
    });

    return {
      ...itemCommon.mapItemSummary(data.create_subitem),
      parent_item_id,
    };
  },
});
