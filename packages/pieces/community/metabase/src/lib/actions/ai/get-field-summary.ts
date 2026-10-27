import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetFieldSummaryOutputSchema } from '../../output-schemas';

export const getFieldSummaryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_field_summary',
  outputSchema: metabaseGetFieldSummaryOutputSchema,
  displayName: 'Get Field Summary',
  description: 'Get the row count and distinct-value count of a field.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns quick statistics for a field: its row count and number of distinct values.',
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getFieldSummary({
      auth,
      fieldId: propsValue.fieldId,
    });
  },
});
