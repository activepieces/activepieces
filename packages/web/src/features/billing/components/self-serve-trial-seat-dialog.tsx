import { isNil, tryCatch } from '@activepieces/core-utils';
import { PlatformAdminSurface } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { platformBillingApi } from '../api/billing-plans-api';
import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { billingQueries, refreshBillingCaches } from '../hooks/billing-hooks';
import { selfServeTrialHooks } from '../hooks/self-serve-trial-hooks';
import { useUpgradeClick } from '../hooks/use-upgrade-click';

import { DeactivateUsersDialog } from './feature-usage/deactivate-users-dialog';

export function SelfServeTrialSeatDialog() {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const grace = selfServeTrialHooks.useSeatGrace();
  const { data: info } = billingQueries.usePlatformSubscription(
    platform.id,
    isPlatformAdmin && !isNil(grace),
  );
  const { isOpen, closeDialog } = billingDialogHooks.useTrialSeatDialogStore();
  const upgradeClick = useUpgradeClick();

  const settleGrace = async () => {
    await tryCatch(() => platformBillingApi.refreshSubscriptionInfo());
    refreshBillingCaches(queryClient);
  };

  const seatGrace = info?.seatGrace;
  if (isNil(grace) || isNil(info) || isNil(seatGrace)) {
    return null;
  }
  const seatLimit = seatGrace.seatLimit;
  const date = dayjs(grace.endsAt).format('MMM D');

  return (
    <DeactivateUsersDialog
      open={isOpen}
      onOpenChange={(next) => !next && closeDialog()}
      targetSeats={seatLimit}
      currentUsers={seatGrace.usedSeats}
      description={t(
        'Your Enterprise trial has ended and the {plan} plan includes {target, plural, =1 {1 seat} other {# seats}}. The users ticked below will be deactivated on {date}. Change who goes, or upgrade to keep everyone.',
        {
          plan: info.autumnPlanName ?? t('Free'),
          target: seatLimit,
          date,
        },
      )}
      preselectedUserIds={seatGrace.userIds}
      preselectedLabel={t('Leaves {date}', { date })}
      hideEmbeddedUsers
      actions={
        <Button
          {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
          type="button"
          variant="link"
          className="sm:mr-auto"
          onClick={() => {
            closeDialog();
            upgradeClick({ surface: PlatformAdminSurface.DIALOG });
          }}
        >
          {t('Explore plans')}
        </Button>
      }
      onConfirmed={() => void settleGrace()}
    />
  );
}
