import { createAction } from '@activepieces/pieces-framework';
import { morphoRequest } from '../morpho-api';

export const getMorphoPrice = createAction({
  name: 'get_morpho_price',
  displayName: 'Get Morpho Price',
  description: 'Get MORPHO token price, market cap, and 24h volume from CoinGecko.',
  props: {},
  async run() {
    const data = await morphoRequest(
      '/coins/morpho?localization=false&tickers=false&community_data=false&developer_data=false',
      'coingecko'
    );
    const market = data.market_data ?? {};
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      currentPriceUsd: market.current_price?.usd,
      marketCapUsd: market.market_cap?.usd,
      totalVolume24hUsd: market.total_volume?.usd,
      priceChange24hPercent: market.price_change_percentage_24h,
      circulatingSupply: market.circulating_supply,
      totalSupply: market.total_supply,
      allTimeHighUsd: market.ath?.usd,
      lastUpdated: market.last_updated,
    };
  },
});
