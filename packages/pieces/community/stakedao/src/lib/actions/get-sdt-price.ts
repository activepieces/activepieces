import { createAction } from '@activepieces/pieces-framework';

export const getSdtPrice = createAction({
  name: 'get_sdt_price',
  displayName: 'Get SDT Price',
  description: 'Get SDT governance token price, market cap, and 24h change from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/stake-dao?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      priceUsd: currentPrice?.['usd'],
      marketCapUsd: marketCap?.['usd'],
      priceChange24hPercent: priceChange24h,
      lastUpdated: marketData?.['last_updated'],
    };
  },
});
