import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { kitDeleteCustomFieldOutputSchema } from '../../output-schemas';

export const kitDeleteCustomField = createAction({
  auth: convertkitAuth,
  name: 'kit_delete_custom_field',
  classification: 'DESTRUCTIVE',
  outputSchema: kitDeleteCustomFieldOutputSchema,
  displayName: 'Delete Custom Field',
  description: 'Permanently delete a custom subscriber field and its values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a custom field by ID, erasing its stored value on every subscriber. It cannot be undone, and a repeat call fails once the field is gone.',
    idempotent: false,
  },
  props: {
    custom_field_id: kitProps.id('Custom Field ID', 'The field ID, from List Custom Fields.'),
  },
  async run(context) {
    const fieldId = kitCommon.id({ value: context.propsValue.custom_field_id, label: 'Custom Field ID' });
    await kitClient.request<unknown>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/custom_fields/${fieldId}`,
    });
    return { success: true, custom_field_id: fieldId };
  },
});
