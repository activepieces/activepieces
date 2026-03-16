import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getSuiPrice = createAction({
  name: 'get_sui_price',
  displayName: 'Get SUI Price',
  description:
    'Fetch the current price and market data for the SUI token via CoinGecko (free, no API key required).',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/sui',
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const priceChange = marketData?.['price_change_percentage_24h'];
    const marketCap = (marketData?.['market_cap'] as Record<string, unknown> | undefined)?.['usd'];
    const totalVolume = (marketData?.['total_volume'] as Record<string, unknown> | undefined)?.['usd'];
    const circulatingSupply = marketData?.['circulating_supply'];
    const totalSupply = marketData?.['total_supply'];

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      price_change_24h_pct: priceChange,
      market_cap_usd: marketCap,
      total_volume_usd: totalVolume,
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      last_updated: marketData?.['last_updated'],
    };
  },
});
