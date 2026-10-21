import { isNil } from '@activepieces/core-utils';
import { SelfServeTrialState } from '@activepieces/shared';

function needsPlanRefresh({
  trialState,
  planTrialEndsAt,
}: NeedsPlanRefreshParams): boolean {
  return trialState === 'ended' && !isNil(planTrialEndsAt);
}

export const trialSeatEnforcement = {
  needsPlanRefresh,
};

type NeedsPlanRefreshParams = {
  trialState: SelfServeTrialState | undefined;
  planTrialEndsAt: string | null | undefined;
};
