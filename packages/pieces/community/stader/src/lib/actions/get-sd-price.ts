import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_BASE_URL } from '../common';

export const getSdPrice = createAction({
  auth: PieceAuth.None(),
  name: 'get_sd_price',
  displayName: 'Get SD Token Price',
  description: 'Get the current USD price, market cap, and 24h trading volume of SD — the Stader governance token.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE_URL}/coins/stader`,
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData ? (marketData['current_price'] as Record<string, unknown>) : {};
    const marketCap = marketData ? (marketData['market_cap'] as Record<string, unknown>) : {};
    const totalVolume = marketData ? (marketData['total_volume'] as Record<string, unknown>) : {};
    const priceChange24h = marketData ? marketData['price_change_percentage_24h'] : null;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      market_cap_usd: marketCap['usd'],
      volume_24h_usd: totalVolume['usd'],
      price_change_24h_percent: priceChange24h,
      last_updated: data['last_updated'],
    };
  },
});
