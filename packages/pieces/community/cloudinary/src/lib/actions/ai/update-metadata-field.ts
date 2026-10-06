import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryGetMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateMetadataField = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_metadata_field',
  outputSchema: cloudinaryGetMetadataFieldOutputSchema,
  displayName: 'Update Metadata Field',
  description: 'Updates a structured metadata field\'s label, mandatory flag or default value.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates the label, mandatory flag, default value or disabled-default flag of a metadata field; omitted settings stay unchanged. The field type cannot change. To change allowed values use Update Metadata Field Datasource.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
    label: Property.ShortText({ displayName: 'Label', description: 'New display label.', required: false }),
    mandatory: aiProps.optionalBoolean({ displayName: 'Mandatory', description: 'Whether every asset must have a value.' }),
    default_value: Property.ShortText({ displayName: 'Default Value', description: 'New default value.', required: false }),
    default_disabled: aiProps.optionalBoolean({ displayName: 'Default Disabled', description: 'Stop applying the default value to new assets.' }),
  },
  async run({ auth, propsValue }) {
    const mandatory = aiResults.toBoolean({ value: propsValue.mandatory });
    const defaultDisabled = aiResults.toBoolean({ value: propsValue.default_disabled });
    const field = propsValue.default_value !== undefined
      ? await makeRequest(auth, HttpMethod.GET, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}`)
      : undefined;
    const body = {
      ...(propsValue.label !== undefined ? { label: propsValue.label } : {}),
      ...(mandatory !== undefined ? { mandatory } : {}),
      ...(propsValue.default_value !== undefined ? { default_value: aiResults.toMetadataDefault({ type: typeof field?.type === 'string' ? field.type : 'string', value: propsValue.default_value }) } : {}),
      ...(defaultDisabled !== undefined ? { default_disabled: defaultDisabled } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one setting to update.');
    }
    return makeRequest(auth, HttpMethod.PUT, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}`, body);
  },
});
