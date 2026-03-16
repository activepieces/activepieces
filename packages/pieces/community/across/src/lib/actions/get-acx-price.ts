import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_API_BASE_URL, ACROSS_COINGECKO_ID } from '../common';

export const getAcxPrice = createAction({
  auth: PieceAuth.None(),
  name: 'get_acx_price',
  displayName: 'Get ACX Price',
  description:
    'Fetch current ACX token price, market cap, 24h trading volume, and price change data via CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COINGECKO_API_BASE_URL}/coins/${ACROSS_COINGECKO_ID}`,
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
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'];
    const priceChange7d = marketData?.['price_change_percentage_7d'];
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const volume = marketData?.['total_volume'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      priceUsd: currentPrice?.['usd'],
      marketCapUsd: marketCap?.['usd'],
      volume24hUsd: volume?.['usd'],
      priceChange24hPct: priceChange24h,
      priceChange7dPct: priceChange7d,
      allTimeHigh: (marketData?.['ath'] as Record<string, number> | undefined)?.['usd'],
      circulatingSupply: marketData?.['circulating_supply'],
      totalSupply: marketData?.['total_supply'],
    };
  },
});
