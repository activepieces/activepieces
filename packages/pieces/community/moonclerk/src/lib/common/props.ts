import { Property } from '@activepieces/pieces-framework';
import { moonclerkAuth } from './auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const customerId = Property.Dropdown({
  auth: moonclerkAuth,
  displayName: 'Customer ID',
  description: 'Select the Customer ID',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const apiKey = auth?.secret_text;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.moonclerk.com/customers',
      headers: {
        Authorization: `Token token=${apiKey}`,
        Accept: 'application/vnd.moonclerk+json;version=1',
      },
    });

    const customers = response.body.customers || [];

    return {
      disabled: false,
      options: customers.map((customer: any) => ({
        label: customer.email || customer.id,
        value: customer.id,
      })),
    };
  },
});
