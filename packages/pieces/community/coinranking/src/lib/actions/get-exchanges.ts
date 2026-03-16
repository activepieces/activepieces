import { createAction, Property } from '@activepieces/pieces-framework';
import { coinrankingAuth } from '../../index';
import { coinrankingRequest } from '../coinranking-api';

export const getExchanges = createAction({
  name: 'get_exchanges',
  displayName: 'Get Exchanges',
  description:
    'List crypto exchanges tracked by CoinRanking with volume and market data.',
  auth: coinrankingAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of exchanges to return (max 100)',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Pagination offset',
      required: false,
      defaultValue: 0,
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort exchanges by this field',
      required: false,
      defaultValue: '24hVolume',
      options: {
        options: [
          { label: '24h Volume', value: '24hVolume' },
          { label: 'Number of Markets', value: 'numberOfMarkets' },
        ],
      },
    }),
    orderDirection: Property.StaticDropdown({
      displayName: 'Order Direction',
      description: 'Ascending or descending',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
  },
  async run(context) {
    const { limit, offset, orderBy, orderDirection } = context.propsValue;
    return coinrankingRequest(context.auth, '/exchanges', {
      limit,
      offset,
      orderBy: orderBy ?? '24hVolume',
      orderDirection: orderDirection ?? 'desc',
    });
  },
});
