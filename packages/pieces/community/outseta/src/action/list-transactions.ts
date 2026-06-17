import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const listTransactionsAction = createAction({
  name: 'list_transactions',
  auth: outsetaAuth,
  displayName: 'List Account Transactions',
  description:
    'Retrieve all billing transactions (payments, refunds, invoices) for a given account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns a paginated list of all billing transactions (payments, refunds, invoices) for an account, by account UID. Use for full history; for just the latest payment use Get Last Payment for Account. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account to retrieve transactions for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
      description: 'Maximum number of transactions to return (default 100).',
    }),
    offset: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 0,
      description:
        'Page number to fetch (0 = first page, 1 = second page, ...). Outseta uses page-based pagination, not record-based.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const limit = context.propsValue.limit ?? 100;
    const offset = context.propsValue.offset ?? 0;

    return client.get<unknown>(
      `/api/v1/billing/transactions/${context.propsValue.accountUid}?limit=${limit}&offset=${offset}&orderBy=Created%20DESC`
    );
  },
});
