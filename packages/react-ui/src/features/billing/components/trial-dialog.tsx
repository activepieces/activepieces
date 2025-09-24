import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { ApSubscriptionStatus, StripePlanName } from '@activepieces/ee-shared';
import { isNil, PlatformRole } from '@activepieces/shared';

import { billingMutations } from '../lib/billing-hooks';

import { useManagePlanDialogStore } from './upgrade-dialog/store';

export const WelcomeTrialDialog = () => {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: user } = userHooks.useCurrentUser();
  const openDialog = useManagePlanDialogStore((state) => state.openDialog);
  const trialPlan =
    user?.platformRole === PlatformRole.ADMIN
      ? (platform.plan.eligibleForTrial as StripePlanName)
      : null;

  const isTrial =
    platform.plan.stripeSubscriptionStatus === ApSubscriptionStatus.TRIALING;
  const [isOpen, setIsOpen] = useState(!isTrial && !!trialPlan);
  const { mutate: startTrial } = billingMutations.useStartTrial();

  const handleClose = () => {
    setIsOpen(false);
    queryClient.invalidateQueries({
      predicate: (query) =>
        ['platform-billing-subscription', 'platform'].includes(
          query.queryKey[0] as string,
        ) && query.queryKey[1] === platform.id,
    });
  };

  useEffectOnce(() => {
    if (!isTrial && !isNil(trialPlan)) {
      startTrial({ plan: trialPlan });
    }
  });

  const handleSeePlans = () => {
    openDialog();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0">
        <div className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <PartyPopper className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-foreground">
                {t('Welcome To Your Free Trial!')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("You're all set! Enjoy 14 days of full access for the")}{' '}
                <Button
                  variant="link"
                  onClick={handleSeePlans}
                  className="px-0"
                >
                  {t(trialPlan ?? '')}
                </Button>{' '}
                {t(
                  'plan — explore all features and make the most of your trial.',
                )}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={handleClose}
                className="flex-1"
                data-testid="trial-dialog-continue-button"
              >
                {t(`Continue on ${trialPlan?.toLowerCase()} Trial`)}
              </Button>

              <Button variant="outline" onClick={handleSeePlans}>
                {t('See Plans')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
