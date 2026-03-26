import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addInvoicePaymentAction = createAction({
  name: 'add_invoice_payment',
  auth: outsetaAuth,
  displayName: 'Add Invoice Payment',
  description:
    'Record a payment against an invoice. The invoice is marked as paid if the total payments match the invoice amount.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account that owns the invoice.',
    }),
    invoiceUid: Property.ShortText({
      displayName: 'Invoice UID',
      required: true,
      description: 'The UID of the invoice to apply the payment to.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
      description: 'Payment amount as a negative number (e.g. -49.00), as required by the Outseta API.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body = {
      Account: { Uid: context.propsValue.accountUid },
      Invoice: { Uid: context.propsValue.invoiceUid },
      Amount: context.propsValue.amount,
    };

    const result = await client.post<any>(
      '/api/v1/billing/transactions/payment',
      body
    );

    return result;
  },
});
