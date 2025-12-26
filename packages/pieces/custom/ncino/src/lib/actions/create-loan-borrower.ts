import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ncinoAuth } from '../..';

export const createLoanBorrower = createAction({
  name: 'create_loan_borrower',
  auth: ncinoAuth,
  displayName: 'Create Loan Borrower',
  description: 'Create a new loan borrower record',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth2 access token (overrides auth if provided)',
      required: false,
    }),
    borrowerData: Property.Json({
      displayName: 'Borrower Data',
      description: 'Loan borrower information as JSON',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken, borrowerData } = context.propsValue;

    const token = accessToken || auth.accessToken;
    if (!token) {
      throw new Error('Access token is required. Provide it in the action or in the auth configuration.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/loans/borrowers`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: borrowerData,
    });

    return response.body;
  },
});
