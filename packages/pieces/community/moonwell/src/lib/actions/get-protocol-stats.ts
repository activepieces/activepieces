import { createAction } from '@activepieces/pieces-framework';
import { getProtocol, getWellTokenData } from '../moonwell-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Returns a combined summary of Moonwell protocol metrics (TVL, chain breakdown) and WELL token data (price, market cap, volume) from DeFiLlama and CoinGecko.',
  props: {},
  async run() {
    const [protocol, tokenData] = await Promise.all([getProtocol(), getWellTokenData()]);

    const md = tokenData.market_data;
    const chainTvls = protocol.chainTvls || {};

    const chainBreakdown = Object.entries(chainTvls)
      .filter(([key]) => !key.includes('-borrowed') && !key.includes('-staking'))
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvlFormatted: `$${(tvl as number).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      }))
      .sort((a, b) => (b.tvl as number) - (a.tvl as number));

    return {
      protocol: {
        name: protocol.name,
        description: protocol.description,
        category: protocol.category,
        chains: protocol.chains,
        tvl: protocol.tvl,
        tvlFormatted: `$${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        tvlChange_1h: protocol.change_1h,
        tvlChange_1d: protocol.change_1d,
        tvlChange_7d: protocol.change_7d,
        chainBreakdown,
        url: protocol.url,
      },
      token: {
        name: tokenData.name,
        symbol: tokenData.symbol.toUpperCase(),
        price_usd: md.current_price.usd,
        price_usd_formatted: `$${md.current_price.usd.toFixed(6)}`,
        market_cap_usd: md.market_cap.usd,
        market_cap_formatted: `$${md.market_cap.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        volume_24h_usd: md.total_volume.usd,
        volume_24h_formatted: `$${md.total_volume.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        price_change_24h_pct: md.price_change_percentage_24h,
        price_change_7d_pct: md.price_change_percentage_7d,
        circulating_supply: md.circulating_supply,
        total_supply: md.total_supply,
      },
    };
  },
});
