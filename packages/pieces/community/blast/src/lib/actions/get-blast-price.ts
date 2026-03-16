import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../blast-api';

export const getBlastPrice = createAction({
  name: 'get_blast_price',
  displayName: 'Get BLAST Token Price',
  description:
    'Fetch the current price, market cap, and 24h trading volume for the BLAST governance token from CoinGecko.',
  props: {},
  async run() {
    const data = await coinGeckoRequest<Record<string, unknown>>(
      '/coins/blast?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
    );
    const market = (data as any).market_data ?? {};
    return {
      id: (data as any).id,
      name: (data as any).name,
      symbol: (data as any).symbol,
      priceUsd: market.current_price?.usd ?? null,
      marketCapUsd: market.market_cap?.usd ?? null,
      volume24hUsd: market.total_volume?.usd ?? null,
      priceChangePercent24h: market.price_change_percentage_24h ?? null,
      allTimeHighUsd: market.ath?.usd ?? null,
      circulatingSupply: market.circulating_supply ?? null,
      totalSupply: market.total_supply ?? null,
    };
  },
});
