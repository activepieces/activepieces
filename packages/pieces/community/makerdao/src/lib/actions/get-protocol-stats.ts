import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCurrentStats } from '../common/makerdao-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch current MakerDAO protocol statistics including DAI supply, total debt, and surplus buffer.',
  props: {},
  async run() {
    const stats = await fetchCurrentStats();
    return {
      daiSupply: stats.dai_supply,
      totalDebt: stats.total_debt,
      surplusBuffer: stats.surplus_buffer,
      systemSurplus: stats.system_surplus,
      daiSavingsRate: stats.dai_savings_rate,
      timestamp: stats.timestamp ?? new Date().toISOString(),
      formatted: {
        daiSupply: formatDai(stats.dai_supply),
        totalDebt: formatDai(stats.total_debt),
        surplusBuffer: formatDai(stats.surplus_buffer),
        daiSavingsRate: `${(stats.dai_savings_rate * 100).toFixed(2)}%`,
      },
    };
  },
});

function formatDai(value: number): string {
  if (!value) return '0 DAI';
  const b = value / 1e9;
  if (b >= 1) return `${b.toFixed(2)}B DAI`;
  const m = value / 1e6;
  if (m >= 1) return `${m.toFixed(2)}M DAI`;
  return `${value.toLocaleString()} DAI`;
}
