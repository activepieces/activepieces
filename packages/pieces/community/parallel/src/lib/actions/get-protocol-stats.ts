import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chains: string[];
  category: string;
  symbol: string;
  description: string;
  url: string;
  currentChainTvls: Record<string, number>;
}

interface CoinGeckoCoin {
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    price_change_percentage_24h: number;
    total_volume: { usd: number };
  };
}

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch combined Parallel Finance stats: TVL from DeFiLlama and PARA price from CoinGecko in a single action.',
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<DefiLlamaProtocol>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/parallel',
      }),
      httpClient.sendRequest<CoinGeckoCoin>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/coins/parallel-finance',
        queryParams: {
          localization: 'false',
          tickers: 'false',
          community_data: 'false',
          developer_data: 'false',
          sparkline: 'false',
        },
      }),
    ]);

    const tvlData = tvlResponse.body;
    const priceData = priceResponse.body;
    const md = priceData.market_data;

    const topChains = Object.entries(tvlData.currentChainTvls ?? {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }));

    return {
      protocol: {
        name: tvlData.name,
        category: tvlData.category,
        symbol: tvlData.symbol,
        url: tvlData.url,
        description: tvlData.description,
      },
      tvl: {
        total: tvlData.tvl,
        formatted: `$${(tvlData.tvl / 1_000_000).toFixed(2)}M`,
        chainCount: tvlData.chains?.length ?? 0,
        topChains,
      },
      paraToken: {
        priceUsd: md.current_price.usd,
        priceFormatted: `$${md.current_price.usd.toFixed(6)}`,
        marketCapUsd: md.market_cap.usd,
        marketCapFormatted: `$${(md.market_cap.usd / 1_000_000).toFixed(2)}M`,
        priceChange24h: md.price_change_percentage_24h,
        priceChange24hFormatted: `${md.price_change_percentage_24h?.toFixed(2)}%`,
        volume24hUsd: md.total_volume.usd,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
});
