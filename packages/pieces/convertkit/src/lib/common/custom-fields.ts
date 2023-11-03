import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { CONVERTKIT_API_URL } from './constants';

export const API_ENDPOINT = 'custom_fields';

export const fetchCustomFields = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${auth}`;
  const response = await fetch(url);
  return await response.json();
};

export const fieldsArray = Property.Array({
  displayName: 'Fields',
  description: 'The custom fields',
  required: true,
});

export const label = Property.Dropdown({
  displayName: 'Custom Label',
  required: true,
  refreshers: ['auth', 'new_label'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const fields = await fetchCustomFields(auth.toString());

    // loop through data and map to options
    const options = fields.custom_fields.map(
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
}) as any;

export const newLabel = Property.DynamicProperties({
  // TODO: refresh after lables are updated. is it possible/useful?
  displayName: 'Event Parameter',
  description: 'The required parameter for the event',
  required: true,
  refreshers: ['label', 'auth'],
  props: async ({ auth, label }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Select labels first',
        options: [],
      };
    }

    const fields: DynamicPropsValue = {};

    fields[label.toString()] = Property.ShortText({
      displayName: `New label`,
      // description: `Enter the new label for ${customField.label}`,
      required: true,
    });

    return fields;
  },
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

    const customFields = await fetchCustomFields(auth.toString());

    // loop through data and map to fields
    customFields.custom_fields.forEach(
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
