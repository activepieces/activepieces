import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ncinoAuth } from '../..';

export const listLoanBorrowers = createAction({
  name: 'list_loan_borrowers',
  auth: ncinoAuth,
  displayName: 'List Loan Borrowers',
  description: 'Retrieve all loan borrowers',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth2 access token (overrides auth if provided)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken, limit, offset } = context.propsValue;

    const token = accessToken || auth.accessToken;
    if (!token) {
      throw new Error('Access token is required. Provide it in the action or in the auth configuration.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${auth.baseUrl}/loans/borrowers`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      queryParams: {
        limit: limit?.toString() || '25',
        offset: offset?.toString() || '0',
      },
    });

    return response.body;
  },
});
