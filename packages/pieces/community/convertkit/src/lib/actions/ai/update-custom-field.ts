import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { CustomField } from '../../common/types';
import { kitUpdateCustomFieldOutputSchema } from '../../output-schemas';

export const kitUpdateCustomField = createAction({
  auth: convertkitAuth,
  name: 'kit_update_custom_field',
  classification: 'WRITE',
  outputSchema: kitUpdateCustomFieldOutputSchema,
  displayName: 'Update Custom Field',
  description: 'Rename a custom subscriber field.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a custom field by ID and returns the updated field. Only the label changes: the field key used in subscriber fields and liquid tags stays the same, and stored subscriber values are kept. If reading the field back fails after the rename, it still succeeds and returns refreshed: false with the reason.',
    idempotent: true,
  },
  props: {
    custom_field_id: kitProps.id('Custom Field ID', 'The field ID, from List Custom Fields.'),
    label: Property.ShortText({
      displayName: 'New Label',
      description: 'The new label. Must be unique on the account.',
      required: true,
    }),
  },
  async run(context) {
    const fieldId = kitCommon.id({ value: context.propsValue.custom_field_id, label: 'Custom Field ID' });
    const label = context.propsValue.label.trim();
    if (!label) {
      throw new Error('New Label cannot be empty.');
    }
    await kitClient.request<unknown>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/custom_fields/${fieldId}`,
      body: { label },
    });
    try {
      const list = await kitClient.request<{ custom_fields: CustomField[] }>({
        apiSecret: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/custom_fields',
      });
      const updated = (list.body.custom_fields ?? []).find((field) => String(field.id) === fieldId);
      if (updated) {
        return { ...updated, refreshed: true };
      }
      return {
        id: Number(fieldId),
        label,
        refreshed: false,
        refresh_error: 'The rename succeeded, but the field was not in the refreshed custom field list.',
      };
    } catch (error) {
      return {
        id: Number(fieldId),
        label,
        refreshed: false,
        refresh_error: `The rename succeeded, but reading the field back failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      };
    }
  },
});
