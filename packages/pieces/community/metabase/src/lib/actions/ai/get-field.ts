import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetFieldOutputSchema } from '../../output-schemas';

export const getFieldAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_field',
  outputSchema: metabaseGetFieldOutputSchema,
  displayName: 'Get Field',
  description: 'Get a field (column) by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns one field's metadata: name, display name, base and semantic type, visibility, foreign-key target and table.",
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getField({
      auth,
      fieldId: propsValue.fieldId,
    });
  },
});
