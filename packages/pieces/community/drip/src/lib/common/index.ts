import { Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const dripCommon = {
  baseUrl: (accountId: string) => {
    return `https://api.getdrip.com/v2/${accountId}`;
  },
  account_id: Property.Dropdown({
    displayName: 'Account',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please fill in API key first',
        };
      }

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.getdrip.com/v2/accounts',
        headers: {
          Authorization: `Basic ${Buffer.from(auth as string).toString(
            'base64'
          )}`,
        },
      };
      const response = await httpClient.sendRequest<{
        accounts: { id: string; name: string }[];
      }>(request);
      const opts = response.body.accounts.map((acc) => {
        return { value: acc.id, label: acc.name };
      });
      return {
        disabled: false,
        options: opts,
      };
    },
  }),
  subscriber: Property.ShortText({
    required: true,
    displayName: 'Subscriber Email',
    description: 'Email of the subscriber',
  }),
  tags: Property.Array({
    displayName: 'tags',
    required: false,
    description: 'Tags to apply to subscriber',
  }),
  custom_fields: Property.Object({
    displayName: 'Custom Fields',
    required: false,
    description: 'Custom field data about the subscriber',
  }),
  authorizationHeader: (apiKey: string) =>
    `Basic ${Buffer.from(apiKey).toString('base64')}`,
};
