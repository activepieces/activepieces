import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { fieldOutputSchema } from '../output-schemas';

export const updateFieldAction = createAction({
  name: 'baserow_update_field',
  classification: 'WRITE',
  outputSchema: fieldOutputSchema,
  displayName: 'Update Field',
  description: 'Renames a field or changes its settings or type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a Baserow field: rename it, change type-specific settings such as select options, or convert its type. Only the given properties change. Converting the type can lose cell data that does not fit the new type. Requires an Email & Password connection. Idempotent — the same update converges on the same field.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    field_id: baserowAiProps.fieldIdProp(),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the current name.',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'New Type',
      description: 'Leave empty to keep the current type. Changing type can drop incompatible values.',
      required: false,
    }),
    options: Property.Json({
      displayName: 'Type Options',
      description:
        'Optional JSON object of type-specific settings to change. For select fields, "select_options" replaces the whole list — include existing options (with their "id") to keep them.',
      required: false,
    }),
  },
  async run(context) {
    const { field_id, name, type, options } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Update Field' });
    const body = {
      ...(options ? baserowAiHelpers.toRecord({ value: options, propName: 'Type Options' }) : {}),
      ...(name ? { name } : {}),
      ...(type ? { type } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one of New Name, New Type or Type Options.');
    }
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(() => client.updateField({ fieldId: field_id, body }));
  },
});
