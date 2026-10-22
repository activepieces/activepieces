import { isNil } from '@activepieces/core-utils';
import { SelfServeTrialState } from '@activepieces/shared';

function needsPlanRefresh({
  trialState,
  trialEndsAt,
  now,
}: NeedsPlanRefreshParams): boolean {
  if (trialState !== 'ended' || isNil(trialEndsAt)) {
    return false;
  }
  const sinceEnd = now - Date.parse(trialEndsAt);
  return sinceEnd >= 0 && sinceEnd < PLAN_REFRESH_WINDOW_MS;
}

export const trialSeatEnforcement = {
  needsPlanRefresh,
};

const PLAN_REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

type NeedsPlanRefreshParams = {
  trialState: SelfServeTrialState | undefined;
  trialEndsAt: string | null | undefined;
  now: number;
};
