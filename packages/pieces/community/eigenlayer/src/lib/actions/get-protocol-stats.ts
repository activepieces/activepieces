import { createAction } from '@activepieces/pieces-framework';
import { fetchEigenLayerProtocol, fetchEigenPrice } from '../eigenlayer-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetches combined protocol TVL and EIGEN token price data in a single request.',
  props: {},
  async run() {
    const [protocol, priceData] = await Promise.all([
      fetchEigenLayerProtocol(),
      fetchEigenPrice(),
    ]);

    const eigen = priceData.eigenlayer;

    return {
      protocol: {
        name: protocol.name,
        tvl: protocol.tvl,
        tvl_formatted: `$${(protocol.tvl / 1e9).toFixed(2)}B`,
        chains: protocol.chains,
        chain_count: protocol.chains.length,
      },
      token: {
        symbol: 'EIGEN',
        price_usd: eigen.usd,
        price_formatted: `$${eigen.usd.toFixed(4)}`,
        market_cap_usd: eigen.usd_market_cap,
        market_cap_formatted: `$${(eigen.usd_market_cap / 1e9).toFixed(2)}B`,
        price_change_24h_percent: Math.round(eigen.usd_24h_change * 100) / 100,
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
