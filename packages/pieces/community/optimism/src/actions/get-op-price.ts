import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/optimism-api';

export const getOpPrice = createAction({
  name: 'get_op_price',
  displayName: 'Get OP Price',
  description: 'Get OP governance token price, market cap, and 24h volume via CoinGecko',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl(
      'https://api.coingecko.com/api/v3/coins/optimism?localization=false&tickers=false&community_data=false&developer_data=false'
    ) as Record<string, unknown>;

    const marketData = (data['market_data'] as Record<string, unknown>) ?? {};
    const currentPrice = (marketData['current_price'] as Record<string, number>) ?? {};
    const marketCap = (marketData['market_cap'] as Record<string, number>) ?? {};
    const volume = (marketData['total_volume'] as Record<string, number>) ?? {};
    const priceChange24h = (marketData['price_change_percentage_24h'] as number) ?? null;
    const circulatingSupply = (marketData['circulating_supply'] as number) ?? null;
    const totalSupply = (marketData['total_supply'] as number) ?? null;

    return {
      token: 'OP',
      name: data['name'] ?? 'Optimism',
      priceUsd: currentPrice['usd'] ?? null,
      marketCapUsd: marketCap['usd'] ?? null,
      volume24hUsd: volume['usd'] ?? null,
      priceChange24hPct: priceChange24h,
      circulatingSupply,
      totalSupply,
      source: 'CoinGecko',
    };
  },
});
