import { AlertChannel, ProjectWithLimits } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { BellMinus, BellPlus, BellRing, ChevronDown } from 'lucide-react';
import pLimit from 'p-limit';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { alertsApi } from '@/features/alerts/api/alerts-api';
import { alertsKeys } from '@/features/alerts/hooks/alert-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type MyAlertSubscriptionsDropdownProps = {
  selectedProjects: ProjectWithLimits[];
};

const MAX_PARALLEL_REQUESTS = 5;
const ALERTS_LIST_LIMIT = 100;

export const MyAlertSubscriptionsDropdown = ({
  selectedProjects,
}: MyAlertSubscriptionsDropdownProps) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = userHooks.useCurrentUser();
  const [open, setOpen] = useState(false);
  const [confirmUnsubscribeOpen, setConfirmUnsubscribeOpen] = useState(false);

  const userEmail = currentUser?.email;
  const hasSelection = selectedProjects.length > 0;

  const invalidateAlerts = () =>
    queryClient.invalidateQueries({ queryKey: alertsKeys.all });

  const { mutate: subscribe, isPending: isSubscribing } = useMutation<
    SubscribeSummary,
    Error,
    { email: string; projects: ProjectWithLimits[] },
    { toastId: string | number }
  >({
    mutationFn: async ({ email, projects }) => {
      const limit = pLimit(MAX_PARALLEL_REQUESTS);
      const results = await Promise.allSettled(
        projects.map(
          (project): Promise<SubscribeOutcome> =>
            limit(async () => {
              try {
                await alertsApi.create({
                  channel: AlertChannel.EMAIL,
                  projectId: project.id,
                  receiver: email,
                });
                return 'subscribed';
              } catch (error) {
                if (api.isError(error) && error.response?.status === 409) {
                  return 'already-subscribed';
                }
                throw error;
              }
            }),
        ),
      );
      return {
        subscribed: results.filter(
          (r) => r.status === 'fulfilled' && r.value === 'subscribed',
        ).length,
        alreadySubscribed: results.filter(
          (r) => r.status === 'fulfilled' && r.value === 'already-subscribed',
        ).length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onMutate: ({ projects }) => ({
      toastId: toast.loading(
        t('subscribingToAlertsOnProjects', { count: projects.length }),
      ),
    }),
    onSuccess: ({ subscribed, alreadySubscribed, failed }, _vars, ctx) => {
      const description =
        alreadySubscribed > 0
          ? t('alertSubscriptionsAlreadySubscribed', {
              count: alreadySubscribed,
            })
          : undefined;
      if (failed > 0) {
        toast.error(
          t('alertSubscriptionsSubscribedSummaryWithFailures', {
            subscribed,
            failed,
          }),
          { id: ctx.toastId, description },
        );
      } else {
        toast.success(
          t('alertSubscriptionsSubscribedSummary', { count: subscribed }),
          { id: ctx.toastId, description },
        );
      }
    },
    onSettled: invalidateAlerts,
  });

  const { mutate: unsubscribe, isPending: isUnsubscribing } = useMutation<
    UnsubscribeSummary,
    Error,
    { email: string; projects: ProjectWithLimits[] },
    { toastId: string | number }
  >({
    mutationFn: async ({ email, projects }) => {
      const limit = pLimit(MAX_PARALLEL_REQUESTS);
      const results = await Promise.allSettled(
        projects.map(
          (project): Promise<UnsubscribeOutcome> =>
            limit(async () => {
              const page = await alertsApi.list({
                projectId: project.id,
                limit: ALERTS_LIST_LIMIT,
              });
              const myAlerts = page.data.filter(
                (alert) =>
                  alert.channel === AlertChannel.EMAIL &&
                  alert.receiver === email,
              );
              if (myAlerts.length === 0) {
                return 'not-subscribed';
              }
              await Promise.all(
                myAlerts.map((alert) => alertsApi.delete(alert.id)),
              );
              return 'unsubscribed';
            }),
        ),
      );
      return {
        unsubscribed: results.filter(
          (r) => r.status === 'fulfilled' && r.value === 'unsubscribed',
        ).length,
        notSubscribed: results.filter(
          (r) => r.status === 'fulfilled' && r.value === 'not-subscribed',
        ).length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onMutate: ({ projects }) => ({
      toastId: toast.loading(
        t('unsubscribingFromAlertsOnProjects', { count: projects.length }),
      ),
    }),
    onSuccess: ({ unsubscribed, notSubscribed, failed }, _vars, ctx) => {
      const description =
        notSubscribed > 0
          ? t('alertSubscriptionsNotSubscribed', { count: notSubscribed })
          : undefined;
      if (failed > 0) {
        toast.error(
          t('alertSubscriptionsUnsubscribedSummaryWithFailures', {
            unsubscribed,
            failed,
          }),
          { id: ctx.toastId, description },
        );
      } else {
        toast.success(
          t('alertSubscriptionsUnsubscribedSummary', { count: unsubscribed }),
          { id: ctx.toastId, description },
        );
      }
    },
    onSettled: invalidateAlerts,
  });

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
            disabled={isRunning}
            className={cn('gap-1', hasSelection && 'border-primary/40')}
          >
            <BellRing className="size-4" />
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

type SubscribeOutcome = 'subscribed' | 'already-subscribed';
type UnsubscribeOutcome = 'unsubscribed' | 'not-subscribed';

type SubscribeSummary = {
  subscribed: number;
  alreadySubscribed: number;
  failed: number;
};

type UnsubscribeSummary = {
  unsubscribed: number;
  notSubscribed: number;
  failed: number;
};
