import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCardTransaction } from '../common';

export const listCardTransactions = createAction({
  auth: brexAuth,
  name: 'list_card_transactions',
  displayName: 'List Card Transactions',
  description: 'List settled transactions across all of your card accounts.',
  props: {
    posted_at_start: Property.DateTime({
      displayName: 'Posted After',
      description: 'Only return transactions posted on or after this date and time.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { posted_at_start, limit } = context.propsValue;
    const response = await brexCommon.apiCall<{ items: BrexCardTransaction[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/transactions/card/primary',
      queryParams: {
        limit: String(limit ?? 50),
        ...(posted_at_start ? { posted_at_start } : {}),
      },
    });
    return response.body.items.map(brexCommon.flattenCardTransaction);
  },
});
