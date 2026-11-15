import { ErrorCode, isNil, tryCatch } from '@activepieces/core-utils';
import { CancelSubscriptionRequest } from '@activepieces/shared';
import { t } from 'i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { planSelectorUtils } from '../components/plan-selector-utils';

import { billingMutations, billingQueries } from './billing-hooks';
import { usePlanSeatFloorGuard } from './use-plan-seat-floor-guard';

export const useCancelSubscriptionGuard = ({
  onCanceled,
}: UseCancelSubscriptionGuardParams = {}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans } = billingQueries.useListPlans(platform.id);
  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
  );
  const { openSeatFloor, seatFloorDialog, activeUsers } =
    usePlanSeatFloorGuard();
  const { mutateAsync: cancelSubscription } =
    billingMutations.useCancelSubscription({
      onDone: onCanceled,
      onSeatLimitExceeded: (request) => openFreeSeatFloor(request),
    });

  const freePlan = plans?.find(
    (plan) => plan.id === planSelectorUtils.FREE_PLAN_ID,
  );
  const targetSeats = freePlan?.includedSeats ?? FREE_PLAN_SEATS_FALLBACK;
  const exceedsFreeSeats = activeUsers > targetSeats;

  const proceedCancel = async (request: CancelSubscriptionRequest) => {
    const { error } = await tryCatch(() => cancelSubscription(request));
    if (!isNil(error) && !api.isApError(error, ErrorCode.QUOTA_EXCEEDED)) {
      throw error;
    }
  };

  const openFreeSeatFloor = (request: CancelSubscriptionRequest) =>
    openSeatFloor({
      targetSeats,
      planName: t('Free'),
      warning: planSelectorUtils.dropToFreeWarning(
        subscription?.additionalSeats,
      ),
      proceed: () => proceedCancel(request),
    });

  const cancelWithSeatCheck = async (
    request: CancelSubscriptionRequest,
  ): Promise<void> => {
    if (exceedsFreeSeats) {
      openFreeSeatFloor(request);
      return;
    }
    await proceedCancel(request);
  };

  return {
    cancelWithSeatCheck,
    exceedsFreeSeats,
    deactivateUsersDialog: seatFloorDialog,
  };
};

const FREE_PLAN_SEATS_FALLBACK = 1;

type UseCancelSubscriptionGuardParams = {
  onCanceled?: () => void;
};
