import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const retrieveLoan = createAction({
  name: 'loan_retrieve',
  auth: icemortgageEncompassAuth,
  displayName: 'Loan - Retrieve',
  description: 'Get loan details from Encompass by loan ID',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { loanId } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/encompass/v3/loans/${loanId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.body;
  },
});
