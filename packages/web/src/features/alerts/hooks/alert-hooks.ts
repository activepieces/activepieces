import { ErrorCode } from '@activepieces/core-utils';
import { Alert, AlertChannel, ProjectWithLimits } from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { alertsApi } from '../api/alerts-api';

export const alertMutations = {
  useCreateAlert: (params?: CreateAlertParams) => {
    const queryClient = useQueryClient();
    const projectId = authenticationSession.getProjectId()!;
    return useMutation<void, Error, { email: string }>({
      mutationFn: async (params) =>
        alertsApi.create({
          receiver: params.email,
          projectId: authenticationSession.getProjectId()!,
          channel: AlertChannel.EMAIL,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: createAlertQueryKey(projectId),
        });
        toast.success(t('Your changes have been saved.'), {
          duration: 3000,
        });
        params?.onSuccess?.();
      },
      onError: (error) => {
        if (
          api.isError(error) &&
          error.response?.status === HttpStatusCode.Conflict &&
          params?.form
        ) {
          params.form.setError('root.serverError', {
            message: t('The email is already added.'),
          });
          return;
        }
        mutationFeedback.error({ error, title: t("Couldn't add the email") });
      },
    });
  },
  useDeleteAlert: () => {
    const queryClient = useQueryClient();
    const projectId = authenticationSession.getProjectId()!;
    return useMutation<void, Error, Alert>({
      mutationFn: (alert) => alertsApi.delete(alert.id),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: createAlertQueryKey(projectId),
        });
        toast.success(t('Your changes have been saved.'), {
          duration: 3000,
        });
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't remove the email"),
        }),
    });
  },
  usePlatformProjectAlertEmails: ({ projectId }: { projectId: string }) => {
    const shared = {
      queryKey: platformProjectAlertsKeys.project(projectId),
      mutationFn: (change: AlertEmailChange) =>
        changeProjectAlertEmail({ projectId, change }),
      apply: ({
        current,
        vars,
      }: {
        current: Alert[];
        vars: AlertEmailChange;
      }): Alert[] =>
        vars.op === 'add'
          ? [...current, optimisticAlert({ projectId, email: vars.email })]
          : current.filter((alert) => alert.receiver !== vars.email),
      invalidate: [createAlertQueryKey(projectId)],
      scope: `platform-project-alerts-${projectId}`,
    };
    const add = useOptimisticMutation<AlertEmailChange, Alert[]>({
      ...shared,
      errorTitle: t("Couldn't add the email"),
    });
    const remove = useOptimisticMutation<AlertEmailChange, Alert[]>({
      ...shared,
      errorTitle: t("Couldn't remove the email"),
      success: ({ vars }) =>
        t('{email} no longer gets alerts', { email: vars.email }),
      undo: ({ vars }) => ({ op: 'add', email: vars.email }),
    });
    return {
      add: (email: string) => add.mutateAsync({ op: 'add', email }),
      remove: (alert: Alert) => {
        if (isOptimisticAlert(alert)) {
          return;
        }
        remove.mutate({
          op: 'remove',
          email: alert.receiver,
          alertId: alert.id,
        });
      },
    };
  },
  useBulkSubscribeAlerts: () => {
    const queryClient = useQueryClient();
    return useMutation<SubscribeSummary, Error, BulkAlertParams>({
      mutationFn: async ({ email, projects }) => {
        const results = await Promise.allSettled(
          projects.map((project) =>
            subscribeProjectToEmail({ projectId: project.id, email }),
          ),
        );
        const created = results.flatMap((result) =>
          result.status === 'fulfilled' && result.value.outcome === 'subscribed'
            ? [result.value.projectId]
            : [],
        );
        return {
          subscribed: created.length,
          alreadySubscribed: countOutcome(results, 'already-subscribed'),
          failed: results.filter((r) => r.status === 'rejected').length,
          created,
        };
      },
      onSuccess: ({ subscribed, alreadySubscribed, failed, created }, vars) => {
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
            { description },
          );
          return;
        }
        const message = t('alertSubscriptionsSubscribedSummary', {
          count: subscribed,
        });
        if (created.length === 0) {
          toast.success(message, { description });
          return;
        }
        mutationFeedback.undo({
          message,
          onUndo: async () => {
            await settleAll(
              created.map((projectId) =>
                unsubscribeProjectFromEmail({
                  projectId,
                  lowerEmail: vars.email.toLowerCase(),
                }),
              ),
            );
            await invalidateAlertLists(queryClient);
          },
        });
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't subscribe to alerts"),
        }),
      onSettled: () => invalidateAlertLists(queryClient),
    });
  },
  useBulkUnsubscribeAlerts: () => {
    const queryClient = useQueryClient();
    return useMutation<UnsubscribeSummary, Error, BulkAlertParams>({
      mutationFn: async ({ email, projects }) => {
        const lowerEmail = email.toLowerCase();
        const results = await Promise.allSettled(
          projects.map((project) =>
            unsubscribeProjectFromEmail({ projectId: project.id, lowerEmail }),
          ),
        );
        const removed = results.flatMap((result) =>
          result.status === 'fulfilled' ? result.value : [],
        );
        return {
          unsubscribed: new Set(removed.map((alert) => alert.projectId)).size,
          notSubscribed: results.filter(
            (result) =>
              result.status === 'fulfilled' && result.value.length === 0,
          ).length,
          failed: results.filter((r) => r.status === 'rejected').length,
          removed,
        };
      },
      onSuccess: ({ unsubscribed, notSubscribed, failed, removed }) => {
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
            { description },
          );
          return;
        }
        const message = t('alertSubscriptionsUnsubscribedSummary', {
          count: unsubscribed,
        });
        if (removed.length === 0) {
          toast.success(message, { description });
          return;
        }
        mutationFeedback.undo({
          message,
          onUndo: async () => {
            await settleAll(
              removed.map((alert) =>
                alertsApi.create({
                  channel: AlertChannel.EMAIL,
                  projectId: alert.projectId,
                  receiver: alert.receiver,
                }),
              ),
            );
            await invalidateAlertLists(queryClient);
          },
        });
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't unsubscribe from alerts"),
        }),
      onSettled: () => invalidateAlertLists(queryClient),
    });
  },
};

export const alertQueries = {
  useAlertsEmailList: () => {
    const projectId = authenticationSession.getProjectId()!;
    return useQuery<Alert[], Error, Alert[]>({
      queryKey: createAlertQueryKey(projectId),
      queryFn: async () => {
        const page = await alertsApi.list({
          projectId,
          limit: ALERTS_LIST_LIMIT,
        });
        return page.data;
      },
    });
  },
  usePlatformProjectAlerts: ({ projectId }: { projectId: string }) => {
    return useQuery<Alert[], Error>({
      queryKey: platformProjectAlertsKeys.project(projectId),
      queryFn: async () =>
        (await alertsApi.list({ projectId, limit: ALERTS_LIST_LIMIT })).data,
    });
  },
};

export const platformProjectAlertsKeys = {
  all: ['platform-project-alerts'] as const,
  project: (projectId: string) =>
    ['platform-project-alerts', projectId] as const,
};

const createAlertQueryKey = (projectId: string) =>
  ['alerts-email-list', projectId] as const;

function invalidateAlertLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: platformProjectAlertsKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['alerts-email-list'] }),
  ]);
}

async function changeProjectAlertEmail({
  projectId,
  change,
}: {
  projectId: string;
  change: AlertEmailChange;
}): Promise<void> {
  if (change.op === 'add') {
    await alertsApi.create({
      channel: AlertChannel.EMAIL,
      projectId,
      receiver: change.email,
    });
    return;
  }
  if (change.alertId !== undefined) {
    await alertsApi.delete(change.alertId);
  }
}

async function settleAll(promises: Promise<unknown>[]): Promise<void> {
  const results = await Promise.allSettled(promises);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (failure) {
    throw failure.reason;
  }
}

function optimisticAlert({
  projectId,
  email,
}: {
  projectId: string;
  email: string;
}): Alert {
  const now = new Date().toISOString();
  return {
    id: `${OPTIMISTIC_ID_PREFIX}${email}`,
    created: now,
    updated: now,
    projectId,
    channel: AlertChannel.EMAIL,
    receiver: email,
  };
}

function isOptimisticAlert(alert: Alert): boolean {
  return alert.id.startsWith(OPTIMISTIC_ID_PREFIX);
}

const subscribeProjectToEmail = async ({
  projectId,
  email,
}: {
  projectId: string;
  email: string;
}): Promise<SubscribeResult> => {
  try {
    await alertsApi.create({
      channel: AlertChannel.EMAIL,
      projectId,
      receiver: email,
    });
    return { outcome: 'subscribed', projectId };
  } catch (error) {
    if (api.isApError(error, ErrorCode.EXISTING_ALERT_CHANNEL)) {
      return { outcome: 'already-subscribed' };
    }
    throw error;
  }
};

const unsubscribeProjectFromEmail = async ({
  projectId,
  lowerEmail,
}: {
  projectId: string;
  lowerEmail: string;
}): Promise<Alert[]> => {
  const page = await alertsApi.list({ projectId, limit: ALERTS_LIST_LIMIT });
  const matches = page.data.filter(
    (alert) =>
      alert.channel === AlertChannel.EMAIL &&
      alert.receiver.toLowerCase() === lowerEmail,
  );
  await Promise.all(matches.map((alert) => alertsApi.delete(alert.id)));
  return matches;
};

const countOutcome = (
  results: PromiseSettledResult<SubscribeResult>[],
  outcome: SubscribeResult['outcome'],
): number =>
  results.reduce(
    (n, r) =>
      n + (r.status === 'fulfilled' && r.value.outcome === outcome ? 1 : 0),
    0,
  );

const ALERTS_LIST_LIMIT = 100;
const OPTIMISTIC_ID_PREFIX = 'optimistic-';

type CreateAlertParams = {
  onSuccess?: () => void;
  form?: UseFormReturn<any>;
};

type BulkAlertParams = {
  email: string;
  projects: ProjectWithLimits[];
};

type SubscribeResult =
  | { outcome: 'subscribed'; projectId: string }
  | { outcome: 'already-subscribed' };

type SubscribeSummary = {
  subscribed: number;
  alreadySubscribed: number;
  failed: number;
  created: string[];
};

type UnsubscribeSummary = {
  unsubscribed: number;
  notSubscribed: number;
  failed: number;
  removed: Alert[];
};

export type AlertEmailChange =
  | { op: 'add'; email: string }
  | { op: 'remove'; email: string; alertId?: string };
