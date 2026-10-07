import { isNil } from '@activepieces/core-utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { platformBillingApi } from '../api/billing-plans-api';
import { billingQueries, refreshBillingCaches } from '../hooks/billing-hooks';
import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { billingUtils } from '../utils/billing-utils';
import { trialSeatEnforcement } from '../utils/trial-seat-enforcement';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { DeactivateUsersDialog } from './feature-usage/deactivate-users-dialog';

export function EnterpriseTrialSeatDialog() {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: status } = enterpriseTrialHooks.useStatus();
  const trialState = status?.state;
  const { data: info } = billingQueries.usePlatformSubscription(
    platform.id,
    trialState === 'ended',
  );
  const { isOpen: managePlanOpen, openDialog: openManagePlanDialog } =
    useManagePlanDialogStore();

  useQuery({
    queryKey: ['enterprise-trial-plan-refresh', platform.id],
    queryFn: async () => {
      await platformBillingApi.refreshSubscriptionInfo();
      refreshBillingCaches(queryClient);
      return true;
    },
    enabled: trialSeatEnforcement.needsPlanRefresh({
      trialState,
      planTrialEndsAt: platform.plan.enterpriseTrialEndsAt,
    }),
    staleTime: Infinity,
    retry: false,
  });

  if (isNil(info)) {
    return null;
  }
  const seatLimit = billingUtils.resolveSeatCap(info).effectiveLimit;
  const enforce = trialSeatEnforcement.shouldEnforce({
    trialState,
    usedSeats: info.usage.users,
    seatLimit,
    managePlanOpen,
  });
  if (!enforce || isNil(seatLimit)) {
    return null;
  }
  const planName = info.autumnPlanName ?? t('Free');

  return (
    <DeactivateUsersDialog
      open={true}
      onOpenChange={() => undefined}
      targetSeats={seatLimit}
      currentUsers={info.usage.users}
      onConfirmed={() => refreshBillingCaches(queryClient)}
      enforced={{
        description: t(
          'Your Enterprise trial has ended, and the {plan} plan includes {target, plural, =1 {1 seat} other {# seats}}. Choose who to deactivate to continue.',
          { plan: planName, target: seatLimit },
        ),
        ownerOnlyMessage: t(
          'Only the platform owner can choose who keeps a seat on the {plan} plan. Ask them to sign in, or upgrade to add seats.',
          { plan: planName },
        ),
        excludeUserId: authenticationSession.getCurrentUserId(),
        actions: (
          <>
            <EnterpriseTrialSalesLink
              surface="enterprise_trial_seats"
              label={t('Talk to sales')}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => openManagePlanDialog()}
            >
              {t('Upgrade')}
            </Button>
          </>
        ),
      }}
    />
  );
}
