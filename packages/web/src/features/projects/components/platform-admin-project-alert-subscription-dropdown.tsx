import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Bell, BellMinus, BellPlus, BellRing, ChevronDown } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { alertMutations } from '@/features/alerts';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export const PlatformAdminProjectAlertSubscriptionDropdown = ({
  selectedProjects,
}: PlatformAdminProjectAlertSubscriptionDropdownProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [open, setOpen] = useState(false);
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false);

  const userEmail = currentUser?.email;
  const hasSelection = selectedProjects.length > 0;

  const { mutate: subscribe, isPending: isSubscribing } =
    alertMutations.useBulkSubscribeAlerts();
  const { mutate: unsubscribe, isPending: isUnsubscribing } =
    alertMutations.useBulkUnsubscribeAlerts();

  if (!userEmail) {
    return null;
  }

  const isRunning = isSubscribing || isUnsubscribing;

  const handleSubscribe = () => {
    setOpen(false);
    subscribe({ email: userEmail, projects: selectedProjects });
  };

  const handleUnsubscribe = () => {
    setConfirmUnsubscribeOpen(false);
    unsubscribe({ email: userEmail, projects: selectedProjects });
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            loading={isRunning}
            className={cn('gap-1')}
          >
            {hasSelection ? (
              <BellRing className="size-4" />
            ) : (
              <Bell className="size-4" />
            )}
            {t('My alert subscriptions')}
            {hasSelection && (
              <span className="text-muted-foreground">
                ({selectedProjects.length})
              </span>
            )}
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!hasSelection || isRunning}
            onSelect={handleSubscribe}
          >
            <BellPlus className="size-4 mr-2" />
            {t('Subscribe me to alerts on selected projects')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasSelection || isRunning}
            onSelect={() => {
              setOpen(false);
              setConfirmUnsubscribeOpen(true);
            }}
          >
            <BellMinus className="size-4 mr-2" />
            {t('Unsubscribe me from alerts on selected projects')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

type PlatformAdminProjectAlertSubscriptionDropdownProps = {
  selectedProjects: ProjectWithLimits[];
};
