import { createAction, Property } from '@activepieces/pieces-framework';
import { coingeckoAuth } from '../..';
import { coingeckoRequest } from '../common/coingecko-api';

export const getCoinPrice = createAction({
  name: 'get_coin_price',
  displayName: 'Get Coin Price',
  description:
    'Get the current price of one or more cryptocurrencies in any supported currency.',
  auth: coingeckoAuth,
  requireAuth: false,
  props: {
    coinIds: Property.ShortText({
      displayName: 'Coin IDs',
      description:
        'Comma-separated CoinGecko coin IDs (e.g. bitcoin,ethereum,solana)',
      required: true,
    }),
    vsCurrency: Property.ShortText({
      displayName: 'VS Currency',
      description: 'Target currency (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
    include24hrChange: Property.Checkbox({
      displayName: 'Include 24h Change',
      description: 'Include 24-hour price change percentage',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const vsCurrency = propsValue.vsCurrency ?? 'usd';

    const params: Record<string, string> = {
      ids: propsValue.coinIds.split(',').map((id) => id.trim()).join(','),
      vs_currencies: vsCurrency,
    };

    if (propsValue.include24hrChange) {
      params['include_24hr_change'] = 'true';
    }

    const data = await coingeckoRequest<Record<string, Record<string, number>>>(
      auth as string | undefined,
      '/simple/price',
      params
    );

    return data;
  },
});
