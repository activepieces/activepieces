import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const getPnpPrice = createAction({
  name: 'get_pnp_price',
  displayName: 'Get PNP Price',
  description: 'Fetch the current PNP token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/penpie',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;
    const priceChangePercentage24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const priceChangePercentage7d = marketData?.['price_change_percentage_7d'] as number | undefined;
    const circulatingSupply = marketData?.['circulating_supply'] as number | undefined;
    const totalSupply = marketData?.['total_supply'] as number | undefined;
    const ath = marketData?.['ath'] as Record<string, number> | undefined;
    const atl = marketData?.['atl'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      priceUsd: currentPrice?.['usd'],
      marketCapUsd: marketCap?.['usd'],
      volume24hUsd: totalVolume?.['usd'],
      priceChange24hPercent: priceChangePercentage24h,
      priceChange7dPercent: priceChangePercentage7d,
      circulatingSupply,
      totalSupply,
      athUsd: ath?.['usd'],
      atlUsd: atl?.['usd'],
      lastUpdated: marketData?.['last_updated'],
    };
  },
});
