import { createAction } from '@activepieces/pieces-framework';
import { fetchOethCoinData } from '../origin-ether-api';

export const getOethPriceAction = createAction({
  name: 'get_oeth_price',
  displayName: 'Get OETH Price',
  description: 'Fetch the current OETH token price, market capitalization, and 24-hour price change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchOethCoinData();

    const marketData = data.market_data;
    const priceUsd = marketData.current_price['usd'] ?? null;
    const marketCapUsd = marketData.market_cap['usd'] ?? null;
    const priceChange24h = marketData.price_change_percentage_24h ?? null;

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      priceUsd,
      marketCapUsd,
      priceChange24h,
      fetchedAt: new Date().toISOString(),
    };
  },
});
