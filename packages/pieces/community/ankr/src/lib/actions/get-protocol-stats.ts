import { createAction } from '@activepieces/pieces-framework';
import { fetchAnkrProtocol, fetchAnkrPrice } from '../ankr-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: "Fetch a comprehensive overview of Ankr — combining TVL and ANKR token price data in a single parallel call.",
  auth: undefined,
  props: {},
  async run() {
    const [protocol, priceData] = await Promise.all([
      fetchAnkrProtocol(),
      fetchAnkrPrice(),
    ]);

    const ankrPrice = priceData['ankr-network'];
    const currentChainTvls = protocol.currentChainTvls ?? {};
    const chainCount = Object.keys(currentChainTvls).length;

    return {
      protocol: {
        name: protocol.name,
        tvl: protocol.tvl,
        chains: protocol.chains,
        chain_count: chainCount,
        category: protocol.category,
        change_1h: protocol.change_1h,
        change_1d: protocol.change_1d,
        change_7d: protocol.change_7d,
        url: protocol.url,
      },
      token: {
        symbol: 'ANKR',
        price_usd: ankrPrice.usd,
        market_cap_usd: ankrPrice.usd_market_cap,
        change_24h_percent: ankrPrice.usd_24h_change,
      },
      computed: {
        tvl_to_mcap_ratio:
          ankrPrice.usd_market_cap > 0
            ? parseFloat((protocol.tvl / ankrPrice.usd_market_cap).toFixed(4))
            : null,
      },
    };
  },
});
