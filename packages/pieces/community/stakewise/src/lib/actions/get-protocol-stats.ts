import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlamaProtocol, fetchSwisePrice } from '../stakewise-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch a combined snapshot of StakeWise protocol stats: TVL and SWISE token price in a single action.',
  auth: undefined,
  props: {},
  async run() {
    const [protocol, priceData] = await Promise.all([
      fetchDefiLlamaProtocol(),
      fetchSwisePrice(),
    ]);

    const swise = priceData.stakewise;

    return {
      protocol: {
        name: protocol.name,
        symbol: protocol.symbol,
        tvl: protocol.tvl,
        tvlFormatted: `$${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        chains: protocol.chains,
        chainCount: protocol.chains.length,
      },
      token: {
        symbol: 'SWISE',
        priceUsd: swise.usd,
        priceFormatted: `$${swise.usd.toFixed(6)}`,
        marketCapUsd: swise.usd_market_cap,
        marketCapFormatted: `$${swise.usd_market_cap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        volume24hUsd: swise.usd_24h_vol,
        volume24hFormatted: `$${swise.usd_24h_vol.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change24h: swise.usd_24h_change,
        change24hFormatted: `${swise.usd_24h_change >= 0 ? '+' : ''}${swise.usd_24h_change.toFixed(2)}%`,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
});
