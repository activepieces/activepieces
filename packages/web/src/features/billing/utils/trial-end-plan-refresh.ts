import { isNil } from '@activepieces/core-utils';
import { SelfServeTrialState } from '@activepieces/shared';

function shouldRefreshPlan({
  trialState,
  trialEndsAt,
  now,
}: ShouldRefreshPlanParams): boolean {
  if (trialState !== 'ended' || isNil(trialEndsAt)) {
    return false;
  }
  const msSinceTrialEnded = now - Date.parse(trialEndsAt);
  return msSinceTrialEnded >= 0 && msSinceTrialEnded < PLAN_REFRESH_WINDOW_MS;
}

export const trialEndPlanRefresh = {
  shouldRefreshPlan,
};

const PLAN_REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

type ShouldRefreshPlanParams = {
  trialState: SelfServeTrialState | undefined;
  trialEndsAt: string | null | undefined;
  now: number;
};
