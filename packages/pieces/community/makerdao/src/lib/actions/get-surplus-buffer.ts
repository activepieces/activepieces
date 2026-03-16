import { createAction } from '@activepieces/pieces-framework';
import { fetchCurrentStats } from '../common/makerdao-api';

export const getSurplusBuffer = createAction({
  name: 'get_surplus_buffer',
  displayName: 'Get Surplus Buffer',
  description: 'Fetch the MakerDAO protocol surplus buffer and system surplus / net income data.',
  props: {},
  async run() {
    const stats = await fetchCurrentStats();
    const surplusBuffer = stats.surplus_buffer ?? 0;
    const systemSurplus = stats.system_surplus ?? 0;
    const TARGET_BUFFER = 50_000_000; // 50M DAI target

    return {
      surplusBuffer,
      surplusBufferFormatted: formatDai(surplusBuffer),
      systemSurplus,
      systemSurplusFormatted: formatDai(systemSurplus),
      targetBuffer: TARGET_BUFFER,
      targetBufferFormatted: formatDai(TARGET_BUFFER),
      bufferFillPercent: TARGET_BUFFER > 0
        ? `${Math.min((surplusBuffer / TARGET_BUFFER) * 100, 100).toFixed(1)}%`
        : '0%',
      aboveTarget: surplusBuffer >= TARGET_BUFFER,
      excessSurplus: Math.max(0, systemSurplus - TARGET_BUFFER),
      excessSurplusFormatted: formatDai(Math.max(0, systemSurplus - TARGET_BUFFER)),
      timestamp: new Date().toISOString(),
    };
  },
});

function formatDai(value: number): string {
  if (!value || value === 0) return '0 DAI';
  const b = value / 1e9;
  if (b >= 1) return `${b.toFixed(2)}B DAI`;
  const m = value / 1e6;
  if (m >= 1) return `${m.toFixed(2)}M DAI`;
  const k = value / 1e3;
  if (k >= 1) return `${k.toFixed(2)}K DAI`;
  return `${value.toLocaleString()} DAI`;
}
