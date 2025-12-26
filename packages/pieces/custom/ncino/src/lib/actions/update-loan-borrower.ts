import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ncinoAuth } from '../..';

export const updateLoanBorrower = createAction({
  name: 'update_loan_borrower',
  auth: ncinoAuth,
  displayName: 'Update Loan Borrower',
  description: 'Update an existing loan borrower',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth2 access token (overrides auth if provided)',
      required: false,
    }),
    borrowerId: Property.ShortText({
      displayName: 'Borrower ID',
      description: 'The ID of the loan borrower to update',
      required: true,
    }),
    borrowerData: Property.Json({
      displayName: 'Borrower Data',
      description: 'Updated loan borrower information as JSON',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken, borrowerId, borrowerData } = context.propsValue;

    const token = accessToken || auth.accessToken;
    if (!token) {
      throw new Error('Access token is required. Provide it in the action or in the auth configuration.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${auth.baseUrl}/loans/borrowers/${borrowerId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: borrowerData,
    });

    return response.body;
  },
});
