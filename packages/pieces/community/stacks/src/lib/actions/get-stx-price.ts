import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getStxPrice = createAction({
  name: 'get_stx_price',
  displayName: 'Get STX Price',
  description: 'Fetch the current price and market data for STX (Stacks native token) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/blockstack',
    });
    const data = response.body as any;
    const marketData = data['market_data'] || {};
    return {
      name: data['name'],
      symbol: data['symbol'],
      price_usd: marketData['current_price']?.['usd'],
      market_cap_usd: marketData['market_cap']?.['usd'],
      total_volume_usd: marketData['total_volume']?.['usd'],
      price_change_24h_pct: marketData['price_change_percentage_24h'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      ath_usd: marketData['ath']?.['usd'],
      last_updated: marketData['last_updated'],
    };
  },
});
