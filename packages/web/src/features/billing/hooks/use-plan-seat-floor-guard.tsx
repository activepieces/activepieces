import { isNil } from '@activepieces/core-utils';
import { useState } from 'react';

import { platformHooks } from '@/hooks/platform-hooks';

import { DeactivateUsersDialog } from '../components/feature-usage/deactivate-users-dialog';

import { billingQueries } from './billing-hooks';

export const usePlanSeatFloorGuard = ({
  enabled = true,
}: UsePlanSeatFloorGuardParams = {}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [request, setRequest] = useState<SeatFloorRequest | null>(null);
  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
    enabled || !isNil(request),
  );
  const activeUsers = subscription?.usage.users ?? 0;

  const openSeatFloor = (nextRequest: SeatFloorRequest) =>
    setRequest(nextRequest);

  const ensureSeatFloor = ({
    targetSeats,
    ...nextRequest
  }: EnsureSeatFloorParams) => {
    if (!isNil(targetSeats) && activeUsers > targetSeats) {
      setRequest({ targetSeats, ...nextRequest });
      return;
    }
    void nextRequest.proceed();
  };

  const seatFloorDialog = isNil(request) ? null : (
    <DeactivateUsersDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          setRequest(null);
        }
      }}
      targetSeats={request.targetSeats}
      currentUsers={activeUsers}
      planName={request.planName}
      warning={request.warning}
      onConfirmed={() => {
        const proceed = request.proceed;
        setRequest(null);
        void proceed();
      }}
    />
  );

  return { ensureSeatFloor, openSeatFloor, seatFloorDialog, activeUsers };
};

type UsePlanSeatFloorGuardParams = {
  enabled?: boolean;
};

type SeatFloorRequest = {
  targetSeats: number;
  planName?: string;
  warning?: string;
  proceed: () => void | Promise<void>;
};

type EnsureSeatFloorParams = Omit<SeatFloorRequest, 'targetSeats'> & {
  targetSeats: number | null;
};
