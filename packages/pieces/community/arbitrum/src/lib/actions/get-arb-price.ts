import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getArbPriceAction = createAction({
  name: 'get_arb_price',
  displayName: 'Get ARB Price',
  description: 'Fetch the current ARB token price, market cap, volume, and 24h change from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/arbitrum',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const volume = marketData?.['total_volume'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const priceChange7d = marketData?.['price_change_percentage_7d'] as number | undefined;
    const circulatingSupply = marketData?.['circulating_supply'] as number | undefined;
    const totalSupply = marketData?.['total_supply'] as number | undefined;
    const ath = marketData?.['ath'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      volume_24h_usd: volume?.['usd'],
      price_change_24h_percent: priceChange24h,
      price_change_7d_percent: priceChange7d,
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      ath_usd: ath?.['usd'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
