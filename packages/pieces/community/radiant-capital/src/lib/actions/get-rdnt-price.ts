import { createAction } from '@activepieces/pieces-framework';
import { radiantRequest } from '../radiant-api';

export const getRdntPrice = createAction({
  name: 'get_rdnt_price',
  displayName: 'Get RDNT Price',
  description:
    'Get RDNT token price, market cap, and 24h trading volume from CoinGecko.',
  props: {},
  async run() {
    const data = await radiantRequest(
      '/coins/radiant-capital?localization=false&tickers=false&community_data=false&developer_data=false',
      'coingecko'
    );
    const market = data.market_data ?? {};
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      currentPriceUsd: market.current_price?.usd ?? null,
      marketCapUsd: market.market_cap?.usd ?? null,
      totalVolume24hUsd: market.total_volume?.usd ?? null,
      priceChangePercent24h: market.price_change_percentage_24h ?? null,
      circulatingSupply: market.circulating_supply ?? null,
      totalSupply: market.total_supply ?? null,
      lastUpdated: data.last_updated ?? null,
    };
  },
});
