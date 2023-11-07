import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { CustomField } from './models';
import { CONVERTKIT_API_URL } from './constants';

export const API_ENDPOINT = 'custom_fields';

export const fetchCustomFields = async (auth: string): Promise<any> => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;

  const body = {
    api_secret: auth,
  };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{
    custom_fields: CustomField[];
  }>(request);
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch custom fields: ${response.status} ${response.body}`
    );
  }
  return response.body.custom_fields;
};

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
