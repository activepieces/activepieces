import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ncinoAuth } from '../..';

export const getLoan = createAction({
  name: 'get_loan',
  auth: ncinoAuth,
  displayName: 'Get Loan',
  description: 'Retrieve a specific loan by ID',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth2 access token (overrides auth if provided)',
      required: false,
    }),
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken, loanId } = context.propsValue;

    const token = accessToken || auth.accessToken;
    if (!token) {
      throw new Error('Access token is required. Provide it in the action or in the auth configuration.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${auth.baseUrl}/loans/${loanId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
