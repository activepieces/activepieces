import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  fetchCustomFields,
  fieldsArray,
  label,
  newLabel,
} from '../common/custom-fields';
import { CONVERTKIT_API_URL } from '../common/constants';

export const listFields = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_list_fields',
  displayName: 'Custom Fields: List Fields',
  description: 'Returns a list of all custom fields',
  props: {},
  async run(context) {
    const data = await fetchCustomFields(context.auth);
    // if custom_fields exist, return custom_fields
    if (data.custom_fields) {
      return data.custom_fields;
    }
    return data;
  },
});

export const createField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_create_field',
  displayName: 'Custom Fields: Create Field',
  description: 'Create a new custom field',
  props: {
    fields: fieldsArray,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ label: context.propsValue.fields }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error creating field' };
    }

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
    label,
    new_label: newLabel,
  },
  async run(context) {
    const { label, new_label } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${label}`;

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
    label,
  },
  async run(context) {
    const { label } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${label}`;

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
