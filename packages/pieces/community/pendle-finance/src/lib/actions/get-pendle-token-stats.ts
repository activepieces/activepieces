import { createAction } from '@activepieces/pieces-framework';
import { coingeckoRequest } from '../common/pendle-api';

export const getPendleTokenStats = createAction({
  name: 'get_pendle_token_stats',
  displayName: 'Get PENDLE Token Stats',
  description: 'Fetch PENDLE governance token stats including price, market cap, 24h change, and trading volume from CoinGecko',
  props: {},
  async run(_ctx) {
    const data = await coingeckoRequest<any>(
      '/coins/pendle?localization=false&tickers=false&community_data=false'
    );

    const marketData = data?.market_data ?? {};

    return {
      id: data?.id,
      symbol: data?.symbol,
      name: data?.name,
      price_usd: marketData?.current_price?.usd,
      market_cap_usd: marketData?.market_cap?.usd,
      market_cap_rank: data?.market_cap_rank,
      price_change_24h: marketData?.price_change_24h,
      price_change_percentage_24h: marketData?.price_change_percentage_24h,
      total_volume_usd: marketData?.total_volume?.usd,
      high_24h_usd: marketData?.high_24h?.usd,
      low_24h_usd: marketData?.low_24h?.usd,
      circulating_supply: marketData?.circulating_supply,
      total_supply: marketData?.total_supply,
      max_supply: marketData?.max_supply,
      ath_usd: marketData?.ath?.usd,
      ath_date: marketData?.ath_date?.usd,
      last_updated: data?.last_updated,
      raw: data,
    };
  },
});
