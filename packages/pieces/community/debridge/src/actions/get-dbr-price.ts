import { createAction } from '@activepieces/pieces-framework';
import { debridgeRequest } from '../lib/debridge-api';

export const getDbrPrice = createAction({
  name: 'get_dbr_price',
  displayName: 'Get DBR Token Price',
  description: 'Get DBR token price, market cap, and 24h trading volume from CoinGecko',
  props: {},
  async run() {
    const data = await debridgeRequest(
      '/coins/debridge?localization=false&tickers=false&community_data=false&developer_data=false',
      'coingecko'
    );
    const marketData = data.market_data ?? {};
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      currentPriceUsd: marketData.current_price?.usd,
      marketCapUsd: marketData.market_cap?.usd,
      totalVolumeUsd: marketData.total_volume?.usd,
      priceChange24hPercent: marketData.price_change_percentage_24h,
      circulatingSupply: marketData.circulating_supply,
      totalSupply: marketData.total_supply,
      ath: marketData.ath?.usd,
      atl: marketData.atl?.usd,
      lastUpdated: marketData.last_updated,
    };
  },
});
