import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaMappers } from '../common/mappers';
import { OutsetaTransaction } from '../common/outseta-types';

export const getLastPaymentAction = createAction({
  name: 'get_last_payment',
  auth: outsetaAuth,
  displayName: 'Get Last Payment for Account',
  description:
    'Retrieve the most recent payment transaction for an account. Returns found=false if no payment has ever been recorded.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the single most recent payment transaction for an account, or found=false if none exists. Use for the latest payment only; for the full payment/refund/invoice history use List Account Transactions. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account to retrieve the last payment for.',
      placeholder: '1QpnM0nW',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const page = await client.getPage<OutsetaTransaction>(
      `/api/v1/billing/transactions/${context.propsValue.accountUid}?BillingTransactionType=${PAYMENT_TRANSACTION_TYPE}&limit=1&orderBy=Created%20DESC&fields=*,Invoice.Uid,Invoice.Number,Invoice.BillingInvoiceStatus`
    );

    const payment = page.items[0];

    if (!payment) {
      return { found: false, ...outsetaMappers.transaction({}) };
    }

    return { found: true, ...outsetaMappers.transaction(payment) };
  },
});

const PAYMENT_TRANSACTION_TYPE = 2;
