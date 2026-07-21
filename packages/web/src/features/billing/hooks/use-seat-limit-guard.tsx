import { ErrorCode, isNil } from '@activepieces/core-utils';
import { AutumnFeatureId } from '@activepieces/shared';
import { useState } from 'react';

import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { OutOfSeatsDialog } from '../components/feature-usage/out-of-seats-dialog';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { billingQueries } from './billing-hooks';

export const useSeatLimitGuard = () => {
  const [isOutOfSeatsOpen, setIsOutOfSeatsOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: info } = billingQueries.usePlatformSubscription(platform.id);
  const { openDialog } = useManagePlanDialogStore();
  const seatFeature = info?.nonConsumableFeatures.find(
    (feature) => feature.featureId === AutumnFeatureId.USERS_LIMIT,
  );

  const openSeatLimit = () => {
    if (info && seatFeature) {
      setIsOutOfSeatsOpen(true);
    } else {
      openDialog();
    }
  };

  const handleSeatLimitError = (error: Error): boolean => {
    if (!api.isApError(error, ErrorCode.QUOTA_EXCEEDED)) {
      return false;
    }
    openSeatLimit();
    return true;
  };

  const ensureSeatsAvailable = (additionalSeats: number): boolean => {
    if (isNil(info) || !info.billingEnforced || isNil(info.plan.usersLimit)) {
      return true;
    }
    if (additionalSeats > info.plan.usersLimit - info.usage.users) {
      openSeatLimit();
      return false;
    }
    return true;
  };

  const seatLimitDialog =
    info && seatFeature ? (
      <OutOfSeatsDialog
        open={isOutOfSeatsOpen}
        onOpenChange={setIsOutOfSeatsOpen}
        info={info}
        feature={seatFeature}
      />
    ) : null;

  return { handleSeatLimitError, ensureSeatsAvailable, seatLimitDialog };
};
