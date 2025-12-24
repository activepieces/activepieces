import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const getEscrow = createAction({
  name: 'escrow_get',
  displayName: 'Escrow - Get',
  description: 'Retrieve escrow account information from Fiserv',
  auth: fiservAuth,
  props: {
    escrowId: Property.ShortText({
      displayName: 'Escrow ID',
      description: 'The ID of the escrow account to retrieve',
      required: true,
    }),

    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the associated loan',
      required: false,
    }),

    includeTransactions: Property.Checkbox({
      displayName: 'Include Transactions',
      description: 'Include escrow payment transaction history',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { escrowId, loanId, includeTransactions } = context.propsValue;
    const auth = context.auth as any;

    const requestBody: any = {
      EscrowKeys: {
        EscrowId: escrowId,
      },
      IncludeTransactions: includeTransactions,
    };

    if (loanId) {
      requestBody.LoanKeys = {
        LoanId: loanId,
      };
    }

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.ESCROW_GET,
      requestBody
    );

    return response.body;
  },
});
