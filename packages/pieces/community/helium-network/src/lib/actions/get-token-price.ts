import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Get the current USD price and oracle data for HNT and other Helium tokens.',
  props: {
    token: Property.StaticDropdown({
      displayName: 'Token',
      description: 'The Helium token to get price data for.',
      required: true,
      options: {
        options: [
          { label: 'HNT (Helium)', value: 'hnt' },
          { label: 'MOBILE', value: 'mobile' },
          { label: 'IOT', value: 'iot' },
        ],
      },
      defaultValue: 'hnt',
    }),
  },
  async run(context) {
    const { token } = context.propsValue;

    if (token === 'hnt') {
      // HNT oracle price from Helium API
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.helium.io/v1/oracle/prices/current',
      });

      const data = response.body?.data;
      if (!data) {
        throw new Error('Unable to fetch HNT oracle price.');
      }

      return {
        token: 'HNT',
        price_usd: data.price / 1e8,
        price_bones: data.price,
        block: data.block,
        timestamp: data.timestamp,
        source: 'Helium Oracle',
      };
    }

    // For MOBILE and IOT, use CoinGecko public API
    const coinIds: Record<string, string> = {
      mobile: 'helium-mobile',
      iot: 'helium-iot',
    };

    const coinId = coinIds[token as string];
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
    });

    const data = response.body?.[coinId];
    if (!data) {
      throw new Error(`Unable to fetch price for token: ${token}`);
    }

    return {
      token: token.toUpperCase(),
      price_usd: data.usd,
      market_cap_usd: data.usd_market_cap,
      volume_24h_usd: data.usd_24h_vol,
      price_change_24h_pct: data.usd_24h_change,
      source: 'CoinGecko',
    };
  },
});
