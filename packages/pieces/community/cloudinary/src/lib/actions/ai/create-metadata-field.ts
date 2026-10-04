import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryCreateMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryCreateMetadataField = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_create_metadata_field',
  outputSchema: cloudinaryCreateMetadataFieldOutputSchema,
  displayName: 'Create Metadata Field',
  description: 'Creates a structured metadata field.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a structured metadata field of type string, integer, date, enum (single choice) or set (multiple choice). Enum and set fields need Allowed Values. A mandatory field needs a Default Value. Fails if the external_id already exists. Returns the field definition, including its datasource values with their external_ids.',
    idempotent: false,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Field Type',
      description: 'The value type.',
      required: true,
      options: { options: ['string', 'integer', 'date', 'enum', 'set'].map((value) => ({ label: value, value })) },
    }),
    label: Property.ShortText({ displayName: 'Label', description: 'Display label of the field.', required: true }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Unique ID for the field. Generated when empty.', required: false }),
    datasource_values: Property.Array({ displayName: 'Allowed Values', description: 'Allowed values for enum or set fields.', required: false }),
    mandatory: aiProps.includeFlag({ displayName: 'Mandatory', description: 'Every asset must have a value (requires Default Value).' }),
    default_value: Property.ShortText({ displayName: 'Default Value', description: 'Default value. For integer fields a number; for enum/set the external_id of a datasource value.', required: false }),
  },
  async run({ auth, propsValue }) {
    const values = aiResults.cleanArray({ values: propsValue.datasource_values });
    const isList = propsValue.type === 'enum' || propsValue.type === 'set';
    if (isList && values.length === 0) {
      throw new Error('Enum and set fields need at least one allowed value.');
    }
    if (propsValue.mandatory && !propsValue.default_value) {
      throw new Error('A mandatory field needs a default value.');
    }
    const body = {
      type: propsValue.type,
      label: propsValue.label,
      ...(propsValue.external_id ? { external_id: propsValue.external_id.trim() } : {}),
      ...(isList ? { datasource: { values: values.map((value) => ({ value })) } } : {}),
      ...(propsValue.mandatory ? { mandatory: true } : {}),
      ...(propsValue.default_value ? { default_value: toDefaultValue({ type: propsValue.type, value: propsValue.default_value }) } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, '/metadata_fields', body);
  },
});

function toDefaultValue({ type, value }: { type: string; value: string }): string | number | string[] {
  if (type === 'integer') {
    return Number(value);
  }
  if (type === 'set') {
    return value.split(',').map((item) => item.trim());
  }
  return value;
}
