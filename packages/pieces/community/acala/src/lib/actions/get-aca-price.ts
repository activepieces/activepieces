import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAcaPrice = createAction({
  name: 'get-aca-price',
  displayName: 'Get ACA Price',
  description:
    'Fetch the current ACA token price, market cap, and 24h volume from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/acala',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const usd = (obj: Record<string, unknown> | undefined) =>
      obj ? (obj as Record<string, unknown>)['usd'] : null;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price_usd: usd(marketData?.['current_price'] as Record<string, unknown> | undefined),
      market_cap_usd: usd(marketData?.['market_cap'] as Record<string, unknown> | undefined),
      total_volume_usd: usd(marketData?.['total_volume'] as Record<string, unknown> | undefined),
      price_change_24h: marketData?.['price_change_24h'],
      price_change_percentage_24h: marketData?.['price_change_percentage_24h'],
      circulating_supply: marketData?.['circulating_supply'],
      total_supply: marketData?.['total_supply'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
