import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const discardFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_discard_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Discard Field Values',
  description: 'Discard the cached values of one field.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Deletes the distinct values Metabase cached for one field's filter dropdown; they are rebuilt on the next scan. Needs an admin key.",
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.discardFieldValues({
      auth,
      fieldId: propsValue.fieldId,
    });
  },
});
