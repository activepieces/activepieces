import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../liquity-api';

export const getLusdPrice = createAction({
  name: 'get_lusd_price',
  displayName: 'Get LUSD Price',
  description: 'Get the current price and market data for LUSD stablecoin (Liquity USD) via CoinGecko',
  props: {},
  async run() {
    const data = await coinGeckoRequest<any>('/coins/liquity-usd?localization=false&tickers=false&community_data=false&developer_data=false');
    const market = data.market_data ?? {};
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      priceUSD: market.current_price?.usd,
      marketCapUSD: market.market_cap?.usd,
      totalSupply: market.total_supply,
      circulatingSupply: market.circulating_supply,
      priceChange24hPercent: market.price_change_percentage_24h,
      priceChange7dPercent: market.price_change_percentage_7d,
      allTimeHighUSD: market.ath?.usd,
      allTimeLowUSD: market.atl?.usd,
      lastUpdated: market.last_updated,
    };
  },
});
