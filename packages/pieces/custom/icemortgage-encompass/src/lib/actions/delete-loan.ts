import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const deleteLoan = createAction({
  name: 'loan_delete',
  auth: icemortgageEncompassAuth,
  displayName: 'Loan - Delete',
  description: 'Delete a loan from Encompass',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan to delete',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { loanId } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${baseUrl}/encompass/v3/loans/${loanId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      statusCode: response.status,
      message: `Loan ${loanId} deleted successfully`,
    };
  },
});
