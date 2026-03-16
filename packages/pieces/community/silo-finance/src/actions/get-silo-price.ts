import { createAction } from '@activepieces/pieces-framework';
import { siloRequest } from '../lib/silo-api';

export const getSiloPrice = createAction({
  name: 'get_silo_price',
  displayName: 'Get SILO Token Price',
  description:
    'Get the current SILO token price, market cap, and 24h trading volume from CoinGecko.',
  props: {},
  async run() {
    const data = await siloRequest(
      '/coins/silo-finance?localization=false&tickers=false&community_data=false&developer_data=false',
      'coingecko'
    );
    const market = data.market_data ?? {};
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      priceUsd: market.current_price?.usd ?? null,
      marketCapUsd: market.market_cap?.usd ?? null,
      volume24hUsd: market.total_volume?.usd ?? null,
      priceChange24hPct: market.price_change_percentage_24h ?? null,
      ath: market.ath?.usd ?? null,
      athDate: market.ath_date?.usd ?? null,
      lastUpdated: data.last_updated,
    };
  },
});
