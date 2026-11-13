import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const updateFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Update Field Values',
  description: "Set custom display names for a field's values.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the custom display mapping of a field\'s values, e.g. 1 → "Active". Needs an admin key and the field\'s display set to custom mapping.',
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
    values: Property.Json({
      displayName: 'Values',
      description:
        'Array of [value, "display name"] pairs, e.g. [[1, "Active"], [0, "Inactive"]].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateFieldValues({
      auth,
      fieldId: propsValue.fieldId,
      body: { values: propsValue.values },
    });
  },
});
