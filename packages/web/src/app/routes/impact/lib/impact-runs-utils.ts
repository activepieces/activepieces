import { PlatformAnalyticsReport } from '@activepieces/shared';

function sumRunsByFlow(
  runs: PlatformAnalyticsReport['runs'],
): Map<string, number> {
  return runs.reduce((totals, run) => {
    totals.set(run.flowId, (totals.get(run.flowId) ?? 0) + (run.runs ?? 0));
    return totals;
  }, new Map<string, number>());
}

export const impactRunsUtils = { sumRunsByFlow };
