import { t } from 'i18next';
import { PartyPopper, CreditCard, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';

import { billingMutations, billingQueries } from '../lib/billing-hooks';

export const FreeTrialDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: billingInfo } = billingQueries.usePlatformSubscription(
    platform.id,
  );
  const { mutate: redirectToSetupSession } =
    billingMutations.useGetSetupSessionLink();

  useEffect(() => {
    if (
      billingInfo?.plan.stripeSubscriptionStatus ===
      ApSubscriptionStatus.TRIALING
    ) {
      const hasSeenTrialDialog = localStorage.getItem('hasSeenFreeTrialDialog');
      if (!hasSeenTrialDialog) {
        setIsOpen(true);
      }
    }
  }, [billingInfo]);

  const handleClose = () => {
    localStorage.setItem('hasSeenFreeTrialDialog', 'true');
    setIsOpen(false);
  };

  const handleAddPayment = () => {
    redirectToSetupSession();
    handleClose();
  };

  const handleLater = () => {
    handleClose();
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
                {t(
                  "You're all set! Enjoy 14 days of full access with the Plus plan explore all features and make the most of your trial.",
                )}
              </p>
            </div>
            <div className="flex w-full items-stretch flex-col-reverse justify-between gap-3">
              <Button
                onClick={handleLater}
                variant="outline"
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-1" />
                {t('Maybe Later')}
              </Button>

              <Button onClick={handleAddPayment} className="flex-1">
                <CreditCard className="w-4 h-4 mr-1" />
                {t('Add Payment Method')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
