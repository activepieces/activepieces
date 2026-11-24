import {
  Property,
  createAction,
  DropdownState,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { aggregateFieldOutputSchema } from '../output-schemas';

export const aggregateFieldAction = createAction({
  name: 'baserow_aggregate_field',
  classification: 'READ',
  outputSchema: aggregateFieldOutputSchema,
  displayName: 'Aggregate Field',
  description:
    'Calculates a sum, average, count and more over a column in a view.',
  audience: 'human',
  aiMetadata: {
    description:
      'Computes a single aggregate value (sum, average, min, max, median, std dev, variance, or empty/non-empty/unique counts) over one field across all rows of a Baserow grid view. Use for roll-up metrics over a whole view rather than fetching rows yourself; numeric aggregations require a number field. Requires a grid view ID and a field ID. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['table_id'],
    },
    {
      key: 'calculation',
      display: 'section',
      label: 'What to Calculate',
      icon: 'sliders',
      props: ['view_id', 'field_id', 'aggregation_type'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    view_id: Property.Dropdown({
      displayName: 'View',
      description: 'The grid view to use. Its filters apply to the result.',
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
      description: 'The column to calculate over.',
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
      displayName: 'Calculation',
      description:
        'Sum, average, median, deviation and variance need a number column.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Sum', value: 'sum' },
          { label: 'Average', value: 'average' },
          { label: 'Minimum', value: 'min' },
          { label: 'Maximum', value: 'max' },
          { label: 'Count of Filled Cells', value: 'not_empty_count' },
          { label: 'Count of Empty Cells', value: 'empty_count' },
          { label: 'Count of Unique Values', value: 'unique_count' },
          { label: 'Median', value: 'median' },
          { label: 'Standard Deviation', value: 'std_dev' },
          { label: 'Variance', value: 'variance' },
        ],
      },
    }),
  },
  async run(context) {
    const { view_id, field_id, aggregation_type } = context.propsValue;
    const client = await makeClient(context.auth);
    const raw = await client.aggregateField(view_id!, field_id!, aggregation_type!);
    return { result: raw['value'] };
  },
});
