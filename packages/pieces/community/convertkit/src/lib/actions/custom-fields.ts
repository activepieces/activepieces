import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { convertkitAuth } from '../..';
import { fieldsArray, label, new_label } from '../common/custom-fields';
import { CustomField } from '../common/types';
import { CUSTOM_FIELDS_API_ENDPOINT } from '../common/constants';
import { fetchCustomFields } from '../common/service';

export const listFields = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_list_fields',
  displayName: 'List Custom Fields',
  description: 'Returns a list of all custom fields',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every custom field defined on the account, including each field id, key, and label. Use it to discover field keys before setting custom field values on subscribers. Takes no inputs; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return fetchCustomFields(context.auth.secret_text);
  },
});

export const createField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_create_field',
  displayName: 'Create Custom Field',
  description: 'Create a new custom field',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one or more new custom fields from an array of labels (ConvertKit derives each field key from its label). Not idempotent — repeating the call creates duplicate fields, so check List Custom Fields first.',
    idempotent: false,
  },
  props: {
    fields: fieldsArray,
  },
  async run(context) {
    const url = CUSTOM_FIELDS_API_ENDPOINT;

    const body = {
      api_secret: context.auth.secret_text,
      label: context.propsValue.fields,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{
      custom_field: CustomField;
    }>(request);

    if (response.status !== 201) {
      throw new Error(`Error creating field: ${response.status}`);
    }
    return response.body;
  },
});

export const updateField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_update_field',
  displayName: 'Custom Fields: Update Field',
  description: 'Update a custom field',
  audience: 'both',
  aiMetadata: {
    description:
      'Renames an existing custom field, selected by its current label, to a new label. Not idempotent — once the rename succeeds the old label no longer matches, so a retry with the same inputs fails.',
    idempotent: false,
  },
  props: {
    label,
    new_label,
  },
  async run(context) {
    const { label, new_label } = context.propsValue;

    const url = `${CUSTOM_FIELDS_API_ENDPOINT}/${label}`;

    const body = {
      api_secret: context.auth.secret_text,
      label: new_label,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.PUT,
      body,
    };

    const response = await httpClient.sendRequest<{
      custom_field: CustomField;
    }>(request);

    if (response.status !== 204) {
      throw new Error(`Error updating field: ${response.status}`);
    }
    return { status: response.status, message: `Field updated`, success: true };
  },
});

export const deleteField = createAction({
  auth: convertkitAuth,
  name: 'custom_fields_delete_field',
  displayName: 'Custom Fields: Delete Field',
  description: 'Delete a custom field',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a custom field by label, removing it and its stored values from all subscribers. Destructive and not retry-safe — a repeat call fails once the field is gone.',
    idempotent: false,
  },
  props: {
    label,
  },
  async run(context) {
    const { label } = context.propsValue;

    const url = `${CUSTOM_FIELDS_API_ENDPOINT}/${label}`;

    const body = {
      api_secret: context.auth.secret_text,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.DELETE,
      body,
    };

    const response = await httpClient.sendRequest<{
      custom_field: CustomField;
    }>(request);

    if (response.status !== 204) {
      throw new Error(`Error deleting field: ${response.status}`);
    }

    return { status: response.status, message: `Field deleted`, success: true };
  },
});
