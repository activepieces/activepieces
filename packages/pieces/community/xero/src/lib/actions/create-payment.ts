import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createPayment = createAction({
  auth: xeroAuth,
  name: 'createPayment',
  displayName: 'Create Payment',
  description: 'Applies a payment to an invoice in Xero',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.invoice_id,
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'The ID of the bank account or payment account to apply the payment from',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'The date of the payment (YYYY-MM-DD format). Defaults to today if not provided.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the payment to apply to the invoice',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional reference for the payment',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    // Validate amount
    if (propsValue.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    

    const paymentData: any = {
      Invoice: {
        InvoiceID: propsValue.invoice_id,
      },
      Account: {
        AccountID: propsValue.account_id,
      },
      Amount: propsValue.amount,
      ...(propsValue.date && { Date: propsValue.date }),
      ...(propsValue.reference && { Reference: propsValue.reference }),
    };

    // Make the API request
    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      '/Payments',
      { Payments: [paymentData] },
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

   
    return response
  },
});