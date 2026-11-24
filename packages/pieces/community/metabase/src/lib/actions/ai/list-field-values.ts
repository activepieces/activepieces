import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListFieldValuesOutputSchema } from '../../output-schemas';

export const listFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_field_values',
  outputSchema: metabaseListFieldValuesOutputSchema,
  displayName: 'List Field Values',
  description: 'List the distinct values of a field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the distinct values Metabase cached for a field (used by filter dropdowns), with display remappings. Empty when the field is not set to list values.',
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.listFieldValues({
      auth,
      fieldId: propsValue.fieldId,
    });
  },
});
