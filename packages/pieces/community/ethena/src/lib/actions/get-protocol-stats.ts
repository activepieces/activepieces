import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, getEnaPrice } from '../ethena-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch a combined summary of Ethena protocol metrics including TVL, ENA token price, market cap, and chain distribution.',
  props: {},
  async run() {
    const [protocol, priceData] = await Promise.all([
      getProtocolData(),
      getEnaPrice(),
    ]);

    const ena = priceData.ethena;
    const chainTvls = protocol.chainTvls || {};
    const topChains = Object.entries(chainTvls)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvl_formatted: `$${Number(tvl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }));

    return {
      protocol: {
        name: protocol.name,
        tvl: protocol.tvl,
        tvl_formatted: `$${Number(protocol.tvl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change_1h: protocol.change_1h ?? null,
        change_1d: protocol.change_1d ?? null,
        change_7d: protocol.change_7d ?? null,
        chain_count: Object.keys(chainTvls).length,
        top_chains: topChains,
      },
      token: {
        symbol: 'ENA',
        price_usd: ena.usd,
        price_formatted: `$${ena.usd.toFixed(6)}`,
        market_cap_usd: ena.usd_market_cap,
        market_cap_formatted: `$${Number(ena.usd_market_cap).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        volume_24h_usd: ena.usd_24h_vol,
        volume_24h_formatted: `$${Number(ena.usd_24h_vol).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change_24h: ena.usd_24h_change,
        change_24h_formatted: `${ena.usd_24h_change.toFixed(2)}%`,
      },
    };
  },
});
