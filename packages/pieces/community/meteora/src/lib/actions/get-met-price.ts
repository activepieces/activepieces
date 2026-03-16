import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMetPrice = createAction({
  name: 'get_met_price',
  displayName: 'Get MET Price',
  description:
    'Fetch the current price and market data for the MET governance token from CoinGecko.',
  props: {},
  async run() {
    // Try primary slug first
    let response;
    let usedSlug = 'meteora-ag';
    try {
      response = await httpClient.sendRequest<Record<string, unknown>>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/coins/meteora-ag',
        queryParams: {
          localization: 'false',
          tickers: 'false',
          community_data: 'false',
          developer_data: 'false',
        },
      });
    } catch {
      // Fallback to generic slug
      usedSlug = 'meteora';
      response = await httpClient.sendRequest<Record<string, unknown>>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/coins/meteora',
        queryParams: {
          localization: 'false',
          tickers: 'false',
          community_data: 'false',
          developer_data: 'false',
        },
      });
    }

    const coin = response.body as any;
    const marketData = coin.market_data ?? {};
    const currentPrice = marketData.current_price ?? {};
    const marketCap = marketData.market_cap ?? {};
    const totalVolume = marketData.total_volume ?? {};

    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      coingeckoSlug: usedSlug,
      priceUSD: currentPrice.usd ?? null,
      marketCapUSD: marketCap.usd ?? null,
      volume24hUSD: totalVolume.usd ?? null,
      priceChange24hPercent: marketData.price_change_percentage_24h ?? null,
      priceChange7dPercent: marketData.price_change_percentage_7d ?? null,
      athUSD: marketData.ath?.usd ?? null,
      atlUSD: marketData.atl?.usd ?? null,
      circulatingSupply: marketData.circulating_supply ?? null,
      totalSupply: marketData.total_supply ?? null,
      lastUpdated: coin.last_updated ?? null,
    };
  },
});
