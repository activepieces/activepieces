import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getRbtcPrice = createAction({
  name: 'get_rbtc_price',
  displayName: 'Get RBTC Price',
  description: 'Get the current RBTC price in USD. RBTC is the native token of Rootstock and is pegged 1:1 to Bitcoin.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: Record<string, number>;
        market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        price_change_percentage_30d: number;
      };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/bitcoin',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body;
    const marketData = data.market_data;

    return {
      name: 'RBTC (Rootstock Bitcoin)',
      symbol: 'RBTC',
      description: 'RBTC is the native token of Rootstock (RSK), pegged 1:1 to Bitcoin.',
      btcReference: data.name,
      priceUsd: marketData.current_price['usd'],
      priceEur: marketData.current_price['eur'],
      priceBtc: marketData.current_price['btc'],
      marketCapUsd: marketData.market_cap['usd'],
      volumeUsd24h: marketData.total_volume['usd'],
      priceChangePercent24h: marketData.price_change_percentage_24h,
      priceChangePercent7d: marketData.price_change_percentage_7d,
      priceChangePercent30d: marketData.price_change_percentage_30d,
    };
  },
});
