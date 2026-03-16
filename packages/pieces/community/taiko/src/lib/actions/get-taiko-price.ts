import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../taiko-api';

export const getTaikoPrice = createAction({
  name: 'get_taiko_price',
  displayName: 'Get TAIKO Price',
  description: 'Fetch the current TAIKO token price, market cap, and 24h volume from CoinGecko (no API key required).',
  props: {},
  async run() {
    const data = await coinGeckoRequest<any>(
      '/coins/taiko?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
    );
    const md = data.market_data ?? {};
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      currentPriceUsd: md.current_price?.usd,
      marketCapUsd: md.market_cap?.usd,
      totalVolumeUsd: md.total_volume?.usd,
      priceChangePercent24h: md.price_change_percentage_24h,
      circulatingSupply: md.circulating_supply,
      totalSupply: md.total_supply,
      ath: md.ath?.usd,
      atl: md.atl?.usd,
      lastUpdated: data.last_updated,
    };
  },
});
