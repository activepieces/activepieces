import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ncinoAuth } from '../..';

export const getLoanBorrower = createAction({
  name: 'get_loan_borrower',
  auth: ncinoAuth,
  displayName: 'Get Loan Borrower',
  description: 'Retrieve a specific loan borrower by ID',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth2 access token (overrides auth if provided)',
      required: false,
    }),
    borrowerId: Property.ShortText({
      displayName: 'Borrower ID',
      description: 'The ID of the loan borrower to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken, borrowerId } = context.propsValue;

    const token = accessToken || auth.accessToken;
    if (!token) {
      throw new Error('Access token is required. Provide it in the action or in the auth configuration.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${auth.baseUrl}/loans/borrowers/${borrowerId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
