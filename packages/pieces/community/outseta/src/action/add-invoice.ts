import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addInvoiceAction = createAction({
  name: 'add_invoice',
  auth: outsetaAuth,
  displayName: 'Create Invoice',
  description:
    'Create an ad-hoc invoice for an account. The invoice is linked to the account\'s current subscription.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account to invoice.',
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: true,
      description: 'Description for the invoice line item.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
      description: 'Amount for the invoice line item.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Fetch account to get the current subscription UID
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=CurrentSubscription.*`
    );

    const subscriptionUid = account?.CurrentSubscription?.Uid;
    if (!subscriptionUid) {
      throw new Error(
        `Account ${context.propsValue.accountUid} does not have an active subscription.`
      );
    }

    const body = {
      Subscription: { Uid: subscriptionUid },
      InvoiceLineItems: [
        {
          Description: context.propsValue.description,
          Amount: context.propsValue.amount,
        },
      ],
    };

    const result = await client.post<any>('/api/v1/billing/invoices', body);

    return result;
  },
});
