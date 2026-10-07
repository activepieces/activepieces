import { isNil } from '@activepieces/core-utils';
import { EnterpriseTrialState } from '@activepieces/shared';

function shouldEnforce({
  trialState,
  usedSeats,
  seatLimit,
  managePlanOpen,
}: ShouldEnforceParams): boolean {
  return (
    trialState === 'ended' &&
    !managePlanOpen &&
    !isNil(seatLimit) &&
    usedSeats > seatLimit
  );
}

function needsPlanRefresh({
  trialState,
  planTrialEndsAt,
}: NeedsPlanRefreshParams): boolean {
  return trialState === 'ended' && !isNil(planTrialEndsAt);
}

export const trialSeatEnforcement = {
  shouldEnforce,
  needsPlanRefresh,
};

type ShouldEnforceParams = {
  trialState: EnterpriseTrialState | undefined;
  usedSeats: number;
  seatLimit: number | null;
  managePlanOpen: boolean;
};

type NeedsPlanRefreshParams = {
  trialState: EnterpriseTrialState | undefined;
  planTrialEndsAt: string | null | undefined;
};
