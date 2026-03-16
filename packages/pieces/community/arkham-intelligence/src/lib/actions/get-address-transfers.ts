import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { arkhamAuth } from '../../index';
import { arkhamApiCall } from '../arkham-api';

export const getAddressTransfersAction = createAction({
  auth: arkhamAuth,
  name: 'get-address-transfers',
  displayName: 'Get Address Transfers',
  description: 'Track token inflows or outflows for a wallet address. Use to monitor money flows, detect large deposits/withdrawals, and trace fund movements across chains.',
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to track transfers for.',
      required: true,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Whether to fetch inflows (tokens received) or outflows (tokens sent).',
      required: true,
      options: {
        options: [
          { label: 'Inflows (Received)', value: 'inflows' },
          { label: 'Outflows (Sent)', value: 'outflows' },
        ],
      },
    }),
    chain: Property.ShortText({
      displayName: 'Chain',
      description: 'Blockchain to filter by (e.g. ethereum, bitcoin). Leave blank for all chains.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transfer records to return (default: 10).',
      required: false,
      defaultValue: 10,
    }),
    usdGte: Property.Number({
      displayName: 'Minimum USD Value',
      description: 'Only return transfers with a USD value greater than or equal to this amount.',
      required: false,
    }),
  },
  async run(context) {
    const { address, direction, chain, limit, usdGte } = context.propsValue;

    const queryParams: QueryParams = {};
    if (chain) queryParams['chain'] = chain;
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);
    if (usdGte !== undefined && usdGte !== null) queryParams['usdGte'] = String(usdGte);

    const data = await arkhamApiCall({
      apiKey: context.auth,
      endpoint: `/transfers/${direction}`,
      method: HttpMethod.POST,
      body: { address },
      queryParams,
    });
    return data;
  },
});
