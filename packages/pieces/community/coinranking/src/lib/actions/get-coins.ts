import { createAction, Property } from '@activepieces/pieces-framework';
import { coinrankingAuth } from '../../index';
import { coinrankingRequest } from '../coinranking-api';

export const getCoins = createAction({
  name: 'get_coins',
  displayName: 'Get Coins',
  description:
    'List cryptocurrencies with price, market cap, 24h volume, and percentage change.',
  auth: coinrankingAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of coins to return (max 100)',
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
      description: 'Sort coins by this field',
      required: false,
      defaultValue: 'marketCap',
      options: {
        options: [
          { label: 'Market Cap', value: 'marketCap' },
          { label: 'Price', value: 'price' },
          { label: '24h Volume', value: '24hVolume' },
          { label: 'Change', value: 'change' },
          { label: 'Listed At', value: 'listedAt' },
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
    timePeriod: Property.StaticDropdown({
      displayName: 'Time Period',
      description: 'Time period for price change calculation',
      required: false,
      defaultValue: '24h',
      options: {
        options: [
          { label: '1 hour', value: '1h' },
          { label: '3 hours', value: '3h' },
          { label: '12 hours', value: '12h' },
          { label: '24 hours', value: '24h' },
          { label: '7 days', value: '7d' },
          { label: '30 days', value: '30d' },
          { label: '3 months', value: '3m' },
          { label: '1 year', value: '1y' },
          { label: '3 years', value: '3y' },
          { label: '5 years', value: '5y' },
        ],
      },
    }),
  },
  async run(context) {
    const { limit, offset, orderBy, orderDirection, timePeriod } =
      context.propsValue;
    return coinrankingRequest(context.auth, '/coins', {
      limit,
      offset,
      orderBy: orderBy ?? 'marketCap',
      orderDirection: orderDirection ?? 'desc',
      timePeriod: timePeriod ?? '24h',
    });
  },
});
