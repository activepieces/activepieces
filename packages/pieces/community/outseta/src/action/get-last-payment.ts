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

    // GET /api/v1/billing/transactions/{accountUid} returns transactions for the
    // account. Filter to BillingTransactionType=2 (= Payment) and sort by
    // Created DESC to get the most recent payment in a single request.
    const res = await client.get<{ items?: Record<string, unknown>[]; Items?: Record<string, unknown>[] }>(
      `/api/v1/billing/transactions/${context.propsValue.accountUid}?BillingTransactionType=${PAYMENT_TRANSACTION_TYPE}&limit=1&orderBy=Created%20DESC&fields=*,Invoice.*`
    );
    const items = res?.items ?? res?.Items ?? [];
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

    const payment = items[0] as any;
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
