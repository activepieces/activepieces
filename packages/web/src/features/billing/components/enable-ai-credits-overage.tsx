import { t } from 'i18next';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { billingMutations } from '../lib/billing-hooks';

interface EnableAIOverageDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EnableAIOverageDialog({
  isOpen,
  onOpenChange,
}: EnableAIOverageDialogProps) {
  const {
    mutate: createSubscription,
    isPending: isCreatingSubscriptionPending,
  } = billingMutations.useCreateSubscription(onOpenChange);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-purple-50 p-4 mb-6">
            <Info className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-2xl font-semibold">
            {t('Start a Subscription')}
          </h2>
          <p className="mt-2 text-sm max-w-sm">
            {t(
              'To enable AI credit overage and unlock advanced features, please start your subscription first.',
            )}
          </p>

          <div className="mt-8 flex flex-col w-full gap-3">
            <Button
              onClick={() => createSubscription({ newActiveFlowsLimit: 0 })}
              disabled={isCreatingSubscriptionPending}
              loading={isCreatingSubscriptionPending}
              className="w-full"
            >
              {t('Start Subscription (Free)')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
