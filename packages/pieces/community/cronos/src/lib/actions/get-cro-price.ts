import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getCroPrice = createAction({
  name: 'get_cro_price',
  displayName: 'Get CRO Price',
  description: 'Fetch the current CRO token price and market data from CoinGecko (free, no API key required).',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/crypto-com-chain',
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, unknown>;
    const marketCap = marketData['market_cap'] as Record<string, unknown>;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      market_cap_usd: marketCap['usd'],
      price_change_24h_pct: marketData['price_change_percentage_24h'],
      last_updated: marketData['last_updated'],
    };
  },
});
