import { createAction, Property } from '@activepieces/pieces-framework';
import { defillamaRequest, apiUrl } from '../common/defillama-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolTvlResponse {
  name: string;
  symbol: string;
  description: string;
  chain: string;
  chains: string[];
  tvl: TvlDataPoint[];
  currentChainTvls: Record<string, number>;
}

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Get historical TVL data for a specific DeFi protocol by its slug.',
  props: {
    protocol: Property.ShortText({
      displayName: 'Protocol Slug',
      description:
        'The protocol slug (e.g. "aave", "uniswap", "compound"). Use Get All Protocols to find slugs.',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const rawSlug = propsValue.protocol.toLowerCase().trim();
    const slug = rawSlug.replace(/[/?#]/g, '');
    const data = await defillamaRequest<ProtocolTvlResponse>(
      apiUrl(`/protocol/${slug}`)
    );

    const tvlData = data.tvl ?? [];
    const currentTvl =
      tvlData.length > 0
        ? tvlData[tvlData.length - 1].totalLiquidityUSD
        : 0;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      chain: data.chain,
      chains: data.chains,
      current_tvl: currentTvl,
      chain_tvls: data.currentChainTvls,
      historical_tvl: tvlData.slice(-30).map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        tvl: point.totalLiquidityUSD,
      })),
    };
  },
});
