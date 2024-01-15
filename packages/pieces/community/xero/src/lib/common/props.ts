import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const props = {
  tenant_id: Property.Dropdown({
    displayName: 'Organization',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth)
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.xero.com/connections',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (auth as OAuth2PropertyValue).access_token,
        },
      };

      const result = await httpClient.sendRequest<
        {
          id: string;
          authEventId: string;
          tenantId: string;
          tenantType: string;
          tenantName: string;
          createdDateUtc: string;
          updatedDateUtc: string;
        }[]
      >(request);

      if (result.status === 200) {
        return {
          disabled: false,
          options: [
            {
              label: result.body?.[0].tenantName,
              value: result.body?.[0].tenantId,
            },
          ],
        };
      }

      return {
        disabled: true,
        options: [],
        placeholder: 'Error processing tenant_id',
      };
    },
  }),
  invoice_id: Property.ShortText({
    displayName: 'Invoice ID',
    description: 'ID of the invoice to update',
    required: false,
  }),
  contact_id: (required = false) =>
    Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to create invoice for.',
      required: required,
    }),
  contact_name: (required = false) =>
    Property.ShortText({
      displayName: 'Contact Name',
      description: 'Contact name, in full.',
      required: required,
    }),
  contact_email: (required = false) =>
    Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email address of the contact.',
      required: required,
    }),
};
