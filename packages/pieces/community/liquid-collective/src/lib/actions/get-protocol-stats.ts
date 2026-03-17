import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData, fetchLsethPrice } from '../liquid-collective-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch a combined snapshot of Liquid Collective protocol stats: TVL and LsETH price in a single parallel call.',
  auth: undefined,
  props: {},
  async run() {
    const [protocol, priceData] = await Promise.all([fetchProtocolData(), fetchLsethPrice()]);

    return {
      protocolName: protocol.name,
      symbol: protocol.symbol,
      tvl: protocol.tvl,
      tvlFormatted: `$${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chains: protocol.chains ?? [],
      chainCount: (protocol.chains ?? []).length,
      lsethPriceUsd: priceData.usd,
      lsethPriceFormatted: `$${priceData.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      lsethMarketCapUsd: priceData.usd_market_cap ?? null,
      lsethMarketCapFormatted: priceData.usd_market_cap
        ? `$${priceData.usd_market_cap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : null,
      lsethChange24hPercent: priceData.usd_24h_change ?? null,
      lsethChange24hFormatted: priceData.usd_24h_change
        ? `${priceData.usd_24h_change.toFixed(2)}%`
        : null,
    };
  },
});
