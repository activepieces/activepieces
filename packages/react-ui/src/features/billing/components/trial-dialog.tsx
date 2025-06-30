import { t } from 'i18next';
import { PartyPopper } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';

import { billingQueries } from '../lib/billing-hooks';

type FreeTrialDialogPropsType = {
  setIsPlansDialogOpen: (open: boolean) => void;
  isPlansDialogOpen: boolean;
};

export const FreeTrialDialog = ({
  isPlansDialogOpen,
  setIsPlansDialogOpen,
}: FreeTrialDialogPropsType) => {
  const [isOpen, setIsOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: billingInfo } = billingQueries.usePlatformSubscription(
    platform.id,
  );

  useEffect(() => {
    if (
      billingInfo?.plan.stripeSubscriptionStatus ===
      ApSubscriptionStatus.TRIALING
    ) {
      const hasSeenTrialDialog = localStorage.getItem('trial-dialog-seen');
      if (!hasSeenTrialDialog) {
        setIsOpen(true);
      }
    }
  }, [billingInfo]);

  const handleClose = () => {
    localStorage.setItem('trial-dialog-seen', 'true');
    setIsOpen(false);
  };

  const handleContinue = () => {
    handleClose();
  };

  const handleSeePlans = () => {
    handleClose();
    setIsPlansDialogOpen(!isPlansDialogOpen);
  };

  if (
    billingInfo?.plan.stripeSubscriptionStatus !== ApSubscriptionStatus.TRIALING
  ) {
    return null;
  }

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
                  {t('Plus')}
                </Button>{' '}
                {t(
                  'plan explore all features and make the most of your trial.',
                )}
              </p>
            </div>
            <div className="flex w-full items-stretch flex-col justify-between gap-3">
              <Button onClick={handleContinue} className="flex-1">
                {t('Continue on trial')}
              </Button>
              <Button
                onClick={handleSeePlans}
                variant="outline"
                className="flex-1"
              >
                {t('View plans')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
