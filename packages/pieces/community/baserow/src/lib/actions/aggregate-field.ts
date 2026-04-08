import {
  Property,
  createAction,
  DropdownState,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const aggregateFieldAction = createAction({
  name: 'baserow_aggregate_field',
  displayName: 'Aggregate Field',
  description:
    'Calculates an aggregation (sum, average, min, max, count, etc.) over all values of a field in a grid view.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    view_id: Property.Dropdown({
      displayName: 'View',
      description: 'Select the grid view to aggregate.',
      required: true,
      auth: baserowAuth,
      refreshers: ['auth', 'table_id'],
      options: async ({ auth, table_id }): Promise<DropdownState<number>> => {
        if (!auth || typeof table_id !== 'number') {
          return {
            disabled: true,
            placeholder: 'Select a table first.',
            options: [],
          };
        }
        const client = await makeClient(auth);
        const views = await client.listViews(table_id);
        return {
          disabled: false,
          options: views.map((v) => ({ label: v.name, value: v.id })),
        };
      },
    }),
    field_id: Property.Dropdown({
      displayName: 'Field',
      description: 'Select the field to aggregate.',
      required: true,
      auth: baserowAuth,
      refreshers: ['auth', 'table_id'],
      options: async ({ auth, table_id }): Promise<DropdownState<number>> => {
        if (!auth || typeof table_id !== 'number') {
          return {
            disabled: true,
            placeholder: 'Select a table first.',
            options: [],
          };
        }
        const client = await makeClient(auth);
        const fields = await client.listTableFields(table_id);
        return {
          disabled: false,
          options: fields.map((f) => ({ label: f.name, value: f.id })),
        };
      },
    }),
    aggregation_type: Property.StaticDropdown({
      displayName: 'Aggregation Type',
      description:
        'Sum, average, min, max, std_dev and variance only work on number fields.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Sum', value: 'sum' },
          { label: 'Average', value: 'average' },
          { label: 'Min', value: 'min' },
          { label: 'Max', value: 'max' },
          { label: 'Count (non-empty)', value: 'not_empty_count' },
          { label: 'Count (empty)', value: 'empty_count' },
          { label: 'Count (unique values)', value: 'unique_count' },
          { label: 'Median', value: 'median' },
          { label: 'Standard deviation', value: 'std_dev' },
          { label: 'Variance', value: 'variance' },
        ],
      },
    }),
  },
  async run(context) {
    const { view_id, field_id, aggregation_type } = context.propsValue;
    const client = await makeClient(context.auth);
    const raw = (await client.aggregateField(
      view_id!,
      field_id!,
      aggregation_type!
    )) as { value: unknown };
    return { result: raw['value'] };
  },
});
