import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { aggregateFieldAiOutputSchema } from '../output-schemas';

export const aggregateFieldAiAction = createAction({
  name: 'baserow_aggregate_field_ai',
  classification: 'READ',
  outputSchema: aggregateFieldAiOutputSchema,
  displayName: 'Aggregate Field',
  description: 'Computes an aggregate over one field in a grid view.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Computes one aggregate (sum, average, min, max, median, std dev, variance, decile, distribution, or empty/non-empty/unique counts) over a field across all rows visible in a Baserow grid view. Use for totals and metrics instead of paging through rows. Numeric aggregations need a number field. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    view_id: Property.Number({
      displayName: 'Grid View ID',
      description: 'ID of a grid view on the table. Resolve with List Views.',
      required: true,
    }),
    field_id: baserowAiProps.fieldIdProp(),
    aggregation_type: Property.StaticDropdown({
      displayName: 'Aggregation Type',
      description: 'The calculation to run.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Sum', value: 'sum' },
          { label: 'Average', value: 'average' },
          { label: 'Min', value: 'min' },
          { label: 'Max', value: 'max' },
          { label: 'Median', value: 'median' },
          { label: 'Standard deviation', value: 'std_dev' },
          { label: 'Variance', value: 'variance' },
          { label: 'Decile', value: 'decile' },
          { label: 'Distribution', value: 'distribution' },
          { label: 'Count', value: 'count' },
          { label: 'Count (empty)', value: 'empty_count' },
          { label: 'Count (non-empty)', value: 'not_empty_count' },
          { label: 'Count (unique values)', value: 'unique_count' },
        ],
      },
    }),
  },
  async run(context) {
    const { view_id, field_id, aggregation_type } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Aggregate Field' });
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() =>
      client.aggregateField(view_id, field_id, aggregation_type)
    );
    return { aggregation_type, value: response.value };
  },
});
