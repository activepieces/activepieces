import { createAction } from '@activepieces/pieces-framework';
import { fetchRates } from '../common/makerdao-api';

export const getStabilityRates = createAction({
  name: 'get_stability_rates',
  displayName: 'Get Stability Rates',
  description: 'Fetch all vault stability fees and the DAI Savings Rate (DSR) from MakerDAO.',
  props: {},
  async run() {
    const data = await fetchRates();
    const rates = (data.rates ?? []).map((r) => ({
      ilk: r.ilk,
      stabilityFee: r.stability_fee,
      stabilityFeePercent: `${(r.stability_fee * 100).toFixed(2)}%`,
      duty: r.duty,
    }));
    rates.sort((a, b) => a.ilk.localeCompare(b.ilk));
    return {
      dsr: data.dsr,
      dsrPercent: `${((data.dsr ?? 0) * 100).toFixed(2)}%`,
      rateCount: rates.length,
      rates,
    };
  },
});
