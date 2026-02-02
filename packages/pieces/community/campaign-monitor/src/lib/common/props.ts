import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { campaignMonitorAuth } from '../..';

export const clientId = Property.Dropdown({
  displayName: 'Client Account',
  refreshers: [],
  required: true,
  auth: campaignMonitorAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account.',
        options: [],
      };
    }

    const response = await makeRequest(
      { apiKey: auth.secret_text },
      HttpMethod.GET,
      '/clients.json'
    );
    const clients = response.body as { ClientID: string; Name: string }[];

    return {
      disabled: false,
      options: clients.map((client) => {
        return {
          label: client.Name,
          value: client.ClientID,
        };
      }),
    };
  },
});

export const listId = Property.Dropdown({
  auth: campaignMonitorAuth,
  displayName: 'List ID',
  refreshers: ['clientId'],
  required: true,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account.',
        options: [],
      };
    }

    const response = await makeRequest(
      { apiKey: auth.secret_text },
      HttpMethod.GET,
      `/clients/${clientId}/lists.json`
    );
    const lists = response.body as { ListID: string; Name: string }[];

    return {
      disabled: false,
      options: lists.map((list) => {
        return {
          label: list.Name,
          value: list.ListID,
        };
      }),
    };
  },
});

export const customFields = Property.DynamicProperties({
  auth: campaignMonitorAuth,
  displayName: 'Custom Fields',
  refreshers: ['listId'],
  required: true,
  props: async ({ auth, listId }) => {
    if (!auth || !listId) return {};

    const fields: DynamicPropsValue = {};

    const response = await makeRequest(
      {
          apiKey: auth.secret_text,
      },
      HttpMethod.GET,
      `/lists/${listId}/customfields.json`
    );

    const listFields = response.body as Array<{
      FieldName: string;
      Key: string;
      DataType: string;
      FieldOptions: string[];
    }>;

    for (const field of listFields) {
      switch (field.DataType) {
        case 'Text':
          fields[field.Key] = Property.ShortText({
            displayName: field.FieldName,
            required: false,
          });
          break;
        case 'Number':
          fields[field.Key] = Property.Number({
            displayName: field.FieldName,
            required: false,
          });
          break;
        case 'Date':
          fields[field.Key] = Property.DateTime({
            displayName: field.FieldName,
            required: false,
          });
          break;
        case 'MultiSelectOne':
          fields[field.Key] = Property.StaticDropdown({
            displayName: field.FieldName,
            required: false,
            options: {
              disabled: false,
              options: field.FieldOptions.map((option) => ({
                label: option,
                value: option,
              })),
            },
          });
          break;
        case 'MultiSelectMany':
          fields[field.Key] = Property.StaticMultiSelectDropdown({
            displayName: field.FieldName,
            required: false,
            options: {
              disabled: false,
              options: field.FieldOptions.map((option) => ({
                label: option,
                value: option,
              })),
            },
          });
          break;
      }
    }
    return fields;
  },
});
