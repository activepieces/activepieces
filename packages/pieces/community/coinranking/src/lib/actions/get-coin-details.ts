import { createAction, Property } from '@activepieces/pieces-framework';
import { coinrankingAuth } from '../../index';
import { coinrankingRequest } from '../coinranking-api';

export const getCoinDetails = createAction({
  name: 'get_coin_details',
  displayName: 'Get Coin Details',
  description:
    'Get detailed information for a specific coin by its CoinRanking UUID (e.g. Qwsogvtv82FCd for Bitcoin).',
  auth: coinrankingAuth,
  props: {
    coinUuid: Property.ShortText({
      displayName: 'Coin UUID',
      description:
        'The CoinRanking UUID of the coin. Bitcoin = Qwsogvtv82FCd, Ethereum = razxDUgYGNAdQ',
      required: true,
      defaultValue: 'Qwsogvtv82FCd',
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
    const { coinUuid, timePeriod } = context.propsValue;
    return coinrankingRequest(
      context.auth,
      `/coin/${encodeURIComponent(coinUuid)}`,
      { timePeriod: timePeriod ?? '24h' }
    );
  },
});
