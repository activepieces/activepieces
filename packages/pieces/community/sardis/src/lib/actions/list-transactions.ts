import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { sardisAuth } from '../..';
import { sardisCommon } from '../common';

export const sardisListTransactions = createAction({
  name: 'list_transactions',
  auth: sardisAuth,
  displayName: 'List Transactions',
  description:
    'Retrieve recent transactions from the wallet ledger. Returns an append-only audit trail of all payments.',
  props: {
    walletId: sardisCommon.walletId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { walletId, limit } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${sardisCommon.baseUrl}/ledger/entries`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      queryParams: {
        wallet_id: walletId,
        limit: String(Math.min(limit ?? 50, 500)),
      },
    });

    return response.body;
  },
});
