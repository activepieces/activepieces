import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { deleteFieldOutputSchema } from '../output-schemas';

export const deleteFieldAction = createAction({
  name: 'baserow_delete_field',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteFieldOutputSchema,
  displayName: 'Delete Field',
  description: 'Deletes a field and its data from a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a Baserow field and every value stored in it; the field moves to the Baserow trash and can be restored there. The primary field cannot be deleted. Requires an Email & Password connection. Not idempotent — a repeat call fails because the field is gone.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    field_id: baserowAiProps.fieldIdProp(),
  },
  async run(context) {
    const { field_id } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Delete Field' });
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() => client.deleteField({ fieldId: field_id }));
    return { deleted: true, field_id, related_fields: response['related_fields'] ?? [] };
  },
});
