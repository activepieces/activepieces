import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol, fetchCsToken } from '../claystack-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch comprehensive ClayStack protocol statistics combining TVL from DeFiLlama and CS token price from CoinGecko in a single parallel request.',
  auth: undefined,
  props: {},
  async run() {
    const [protocol, csToken] = await Promise.all([
      fetchProtocol(),
      fetchCsToken().catch(() => null),
    ]);

    const totalTvl = Object.values(protocol.currentChainTvls).reduce(
      (sum, v) => sum + v,
      0
    );

    const tvlData = {
      tvl_usd: totalTvl,
      tvl_formatted: `$${totalTvl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change_1h_pct: protocol.change_1h ?? null,
      change_1d_pct: protocol.change_1d ?? null,
      change_7d_pct: protocol.change_7d ?? null,
      chains: Object.keys(protocol.currentChainTvls),
    };

    const priceData = csToken
      ? {
          name: csToken.name,
          symbol: csToken.symbol.toUpperCase(),
          price_usd: csToken.market_data.current_price['usd'] ?? null,
          market_cap_usd: csToken.market_data.market_cap['usd'] ?? null,
          volume_24h_usd: csToken.market_data.total_volume['usd'] ?? null,
          price_change_24h_pct: csToken.market_data.price_change_percentage_24h ?? null,
          circulating_supply: csToken.market_data.circulating_supply ?? null,
          last_updated: csToken.last_updated,
        }
      : null;

    return {
      protocol: protocol.name,
      description: protocol.description,
      url: protocol.url,
      tvl: tvlData,
      cs_token: priceData,
      fetched_at: new Date().toISOString(),
      sources: ['DeFiLlama', 'CoinGecko'],
    };
  },
});
