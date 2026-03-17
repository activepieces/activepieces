import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSlndPrice = createAction({
  name: 'get_slnd_price',
  displayName: 'Get SLND Price',
  description: 'Fetch the current SLND governance token price from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/solend',
    });

    const data = response.body as any;

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      priceUSD: data.market_data?.current_price?.usd,
      priceChangePercentage24h: data.market_data?.price_change_percentage_24h,
      marketCapUSD: data.market_data?.market_cap?.usd,
      totalVolumeUSD: data.market_data?.total_volume?.usd,
      circulatingSupply: data.market_data?.circulating_supply,
      totalSupply: data.market_data?.total_supply,
      athUSD: data.market_data?.ath?.usd,
      athDate: data.market_data?.ath_date?.usd,
      lastUpdated: data.market_data?.last_updated,
    };
  },
});
