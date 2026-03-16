import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { arkhamAuth } from '../../index';
import { arkhamApiCall } from '../arkham-api';

export const getTransactionsAction = createAction({
  auth: arkhamAuth,
  name: 'get-transactions',
  displayName: 'Get Transactions',
  description: 'Retrieve on-chain transactions for a wallet address, with optional filters for chain, minimum USD value, and pagination.',
  props: {
    base: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to retrieve transactions for.',
      required: true,
    }),
    chain: Property.ShortText({
      displayName: 'Chain',
      description: 'Blockchain to query (e.g. ethereum, bitcoin, arbitrum, bsc, polygon). Leave blank for all chains.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return (default: 10).',
      required: false,
      defaultValue: 10,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of transactions to skip (for pagination).',
      required: false,
    }),
    usdGte: Property.Number({
      displayName: 'Minimum USD Value',
      description: 'Only return transactions with a USD value greater than or equal to this amount.',
      required: false,
    }),
  },
  async run(context) {
    const { base, chain, limit, offset, usdGte } = context.propsValue;

    const queryParams: QueryParams = { base };
    if (chain) queryParams['chain'] = chain;
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);
    if (offset !== undefined && offset !== null) queryParams['offset'] = String(offset);
    if (usdGte !== undefined && usdGte !== null) queryParams['usdGte'] = String(usdGte);

    const data = await arkhamApiCall({
      apiKey: context.auth,
      endpoint: '/transactions',
      method: HttpMethod.GET,
      queryParams,
    });
    return data;
  },
});
