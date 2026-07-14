import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/transactions/v1.0/{transaction}/resend-invoice
export const transactionResendInvoiceAction = createAction({
  auth: ampecoAuth,
  name: 'transactionResendInvoice',
  displayName: 'Actions - Transactions - Resend Invoice',
  description: 'Resend already issued invoice. If the transaction has an associated fiscalized receipt that was automatically canceled (Hungary compliance), both the invoice and the storno receipt will be sent together.',
  audience: 'both',
  aiMetadata: { description: 'Re-send the invoice already issued for a transaction to the customer. Use only when an invoice exists (use the issue-invoice action first if one does not). Not idempotent: each call dispatches the email/document again, so repeated calls send duplicate copies.', idempotent: false },
  props: {
        
  transaction: Property.Number({
    displayName: 'Transaction',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/transactions/v1.0/{transaction}/resend-invoice', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
