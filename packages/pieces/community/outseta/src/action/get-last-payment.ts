import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getLastPaymentAction = createAction({
  name: 'get_last_payment',
  auth: outsetaAuth,
  displayName: 'Get Last Payment for Account',
  description:
    'Retrieve the most recent payment transaction for an account. Returns found=false if no payment has ever been recorded.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account to retrieve the last payment for.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Outseta's /billing/transactions/ endpoint ignores orderBy/orderDirection
    // and returns transactions in ascending Created order. We fetch all payments
    // then pick the last one in the array (= most recent).
    const items = await client.getAllPages<any>(
      `/api/v1/billing/transactions/${context.propsValue.accountUid}?BillingTransactionType=${PAYMENT_TRANSACTION_TYPE}&fields=*,Invoice.*`
    );
    if (items.length === 0) {
      return {
        found: false,
        uid: null,
        amount: null,
        date: null,
        invoice_uid: null,
        invoice_number: null,
        created: null,
      };
    }

    const payment = items[items.length - 1];
    return {
      found: true,
      uid: payment.Uid ?? null,
      amount: payment.Amount ?? null,
      date: payment.TransactionDate ?? payment.Created ?? null,
      invoice_uid: payment.Invoice?.Uid ?? null,
      invoice_number: payment.Invoice?.Number ?? null,
      created: payment.Created ?? null,
    };
  },
});

const PAYMENT_TRANSACTION_TYPE = 2;
