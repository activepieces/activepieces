import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { CustomField } from '../types';
import { fetchCustomFields } from '../service';

export const fieldsArray = Property.Array({
  displayName: 'Fields',
  description: 'The custom fields',
  required: true,
});

export const label = Property.Dropdown({
  displayName: 'Custom Label',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const fields: CustomField[] = await fetchCustomFields(auth.toString());

    // loop through data and map to options
    const options = fields.map(
      (field: { id: string; label: string; key: string; name: string }) => {
        return {
          label: field.label,
          value: field.id,
        };
      }
    );

    return {
      options,
    };
  },
});

export const new_label = Property.ShortText({
  displayName: 'New Label',
  description: 'The new label for the custom field',
  required: true,
});

export const allFields = Property.DynamicProperties({
  displayName: 'Custom Fields',
  description: 'The custom fields',
  required: false,
  refreshers: ['auth'],
  props: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const fields: DynamicPropsValue = {};

    const customFields: CustomField[] = await fetchCustomFields(
      auth.toString()
    );

    // loop through data and map to fields
    customFields.forEach(
      (field: { id: string; label: string; key: string; name: string }) => {
        fields[field.key] = Property.ShortText({
          displayName: field.label,
          description: `Enter the value for custom field: ${field.label}`,
          required: false,
        });
      }
    );

    return fields;
  },
});
