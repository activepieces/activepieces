import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_API_BASE_URL, BIFI_COINGECKO_ID } from '../common';

export const getBifiPrice = createAction({
  auth: PieceAuth.None(),
  name: 'get_bifi_price',
  displayName: 'Get BIFI Price',
  description:
    'Fetch the current price and market data for the BIFI governance token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COINGECKO_API_BASE_URL}/coins/${BIFI_COINGECKO_ID}`,
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
    const usdPrice = marketData
      ? (marketData['current_price'] as Record<string, number>)?.['usd']
      : undefined;
    const marketCap = marketData
      ? (marketData['market_cap'] as Record<string, number>)?.['usd']
      : undefined;
    const priceChange24h = marketData
      ? (marketData['price_change_percentage_24h'] as number)
      : undefined;
    const volume24h = marketData
      ? (marketData['total_volume'] as Record<string, number>)?.['usd']
      : undefined;
    const circulatingSupply = marketData
      ? (marketData['circulating_supply'] as number)
      : undefined;
    const totalSupply = marketData
      ? (marketData['total_supply'] as number)
      : undefined;
    const ath = marketData
      ? (marketData['ath'] as Record<string, number>)?.['usd']
      : undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      currentPriceUsd: usdPrice,
      marketCapUsd: marketCap,
      priceChange24hPercent: priceChange24h,
      volume24hUsd: volume24h,
      circulatingSupply,
      totalSupply,
      athUsd: ath,
      lastUpdated: marketData ? marketData['last_updated'] : undefined,
    };
  },
});
