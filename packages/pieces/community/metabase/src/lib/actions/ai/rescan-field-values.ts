import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const rescanFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_rescan_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Rescan Field Values',
  description: 'Rescan the distinct values of one field.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Rescans the distinct values Metabase caches for one field's filter dropdown. Needs an admin key.",
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.rescanFieldValues({
      auth,
      fieldId: propsValue.fieldId,
    });
  },
});
