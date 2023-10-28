import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';

const API_ENDPOINT = 'custom_fields';

export const getCustomFields = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${auth}`;
  const response = await fetch(url);
  return await response.json();
}

export const listFields = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_list_fields',
  displayName: 'Custom Fields: List Fields',
  description: 'Returns a list of all custom fields',
  props: {},
  async run(context) {
    return getCustomFields(context.auth);
  },
});


export const propertyCustomFields =  Property.DynamicProperties({
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

    const customFields = await getCustomFields(auth.toString());

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

    console.debug('fields: ', fields);
    return fields;
  },
});

export const createField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_create_field',
  displayName: 'Custom Fields: Create Field',
  description: 'Create a new custom field',
  props: {
    // TODO: Add validation for the fields
    fields: Property.Array({
      displayName: 'Fields',
      description: 'The custom fields',
      required: true,
    }),
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ label: context.propsValue.fields }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const updateField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_update_field',
  displayName: 'Custom Fields: Update Field',
  description: 'Update a custom field',
  props: {
    label: Property.Dropdown({
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

        const fields = await getCustomFields(auth.toString());

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
    }),
    new_label: Property.DynamicProperties({
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
        console.debug('fields: ', fields);
        return fields;
      },
    }),
  },
  async run(context) {
    const { label, new_label } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${label}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({
        label: new_label[label],
        api_secret: context.auth,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error updating field' };
    }
    return { success: true, message: 'Field updated successfully' };
  },
});

export const deleteField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_delete_field',
  displayName: 'Custom Fields: Delete Field',
  description: 'Delete a custom field',
  props: {
    label: Property.Dropdown({
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

        const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${auth}`;
        const response = await fetch(url);
        const data = await response.json();

        // loop through data and map to options
        const options = data.custom_fields.map(
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
    }),
  },
  async run(context) {
    const { label } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${label}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({ api_secret: context.auth }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error deleting field' };
    }
    return { success: true, message: 'Field deleted successfully' };
  },
});
