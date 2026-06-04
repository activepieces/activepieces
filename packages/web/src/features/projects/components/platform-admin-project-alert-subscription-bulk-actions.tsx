import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { BellMinus, BellPlus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { alertMutations } from '@/features/alerts';
import { userHooks } from '@/hooks/user-hooks';

export const PlatformAdminProjectAlertSubscriptionBulkActions = ({
  selectedProjects,
  resetSelection,
}: PlatformAdminProjectAlertSubscriptionBulkActionsProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false);

  const { mutate: subscribe, isPending: isSubscribing } =
    alertMutations.useBulkSubscribeAlerts();
  const { mutate: unsubscribe, isPending: isUnsubscribing } =
    alertMutations.useBulkUnsubscribeAlerts();

  const userEmail = currentUser?.email;
  if (!userEmail || selectedProjects.length === 0) {
    return null;
  }

  const isRunning = isSubscribing || isUnsubscribing;

  const handleSubscribe = () => {
    subscribe({ email: userEmail, projects: selectedProjects });
    resetSelection();
  };

  const handleUnsubscribe = () => {
    setConfirmUnsubscribeOpen(false);
    unsubscribe({ email: userEmail, projects: selectedProjects });
    resetSelection();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={isRunning}
        onClick={handleSubscribe}
      >
        <BellPlus className="mr-1 w-4" />
        {t('Subscribe to alerts')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isRunning}
        onClick={() => setConfirmUnsubscribeOpen(true)}
      >
        <BellMinus className="mr-1 w-4" />
        {t('Unsubscribe from alerts')}
      </Button>

      <Dialog
        open={confirmUnsubscribeOpen}
        onOpenChange={setConfirmUnsubscribeOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('Unsubscribe from alerts on selected projects?')}
            </DialogTitle>
            <DialogDescription>
              {t('unsubscribeAlertsConfirmDescription', {
                email: userEmail,
                count: selectedProjects.length,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmUnsubscribeOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleUnsubscribe}>
              {t('Unsubscribe')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

type PlatformAdminProjectAlertSubscriptionBulkActionsProps = {
  selectedProjects: ProjectWithLimits[];
  resetSelection: () => void;
};
