import {
  Alert,
  AlertChannel,
  ErrorCode,
  ProjectWithLimits,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { alertsApi } from '../api/alerts-api';

export const alertMutations = {
  useCreateAlert: (params?: CreateAlertParams) => {
    const queryClient = useQueryClient();
    const projectId = authenticationSession.getProjectId()!;
    return useMutation<Alert, Error, { email: string }>({
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
        if (api.isError(error)) {
          switch (error.response?.status) {
            case HttpStatusCode.Conflict:
              params?.form?.setError('root.serverError', {
                message: t('The email is already added.'),
              });
              break;
            default: {
              internalErrorToast();
              break;
            }
          }
        }
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
    });
  },
  useBulkSubscribeAlerts: () => {
    return useMutation<
      SubscribeSummary,
      Error,
      BulkAlertParams,
      { toastId: string | number }
    >({
      mutationFn: async ({ email, projects }) => {
        const results = await Promise.allSettled(
          projects.map((project) =>
            subscribeProjectToEmail({ projectId: project.id, email }),
          ),
        );
        return {
          subscribed: countOutcome(results, 'subscribed'),
          alreadySubscribed: countOutcome(results, 'already-subscribed'),
          failed: results.filter((r) => r.status === 'rejected').length,
        };
      },
      onSuccess: ({ subscribed, alreadySubscribed, failed }) => {
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
        } else {
          toast.success(
            t('alertSubscriptionsSubscribedSummary', { count: subscribed }),
            { description },
          );
        }
      },
    });
  },
  useBulkUnsubscribeAlerts: () => {
    return useMutation<
      UnsubscribeSummary,
      Error,
      BulkAlertParams,
      { toastId: string | number }
    >({
      mutationFn: async ({ email, projects }) => {
        const lowerEmail = email.toLowerCase();
        const results = await Promise.allSettled(
          projects.map((project) =>
            unsubscribeProjectFromEmail({ projectId: project.id, lowerEmail }),
          ),
        );
        return {
          unsubscribed: countOutcome(results, 'unsubscribed'),
          notSubscribed: countOutcome(results, 'not-subscribed'),
          failed: results.filter((r) => r.status === 'rejected').length,
        };
      },
      onSuccess: ({ unsubscribed, notSubscribed, failed }) => {
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
        } else {
          toast.success(
            t('alertSubscriptionsUnsubscribedSummary', { count: unsubscribed }),
            { description },
          );
        }
      },
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
};

const createAlertQueryKey = (projectId: string) =>
  ['alerts-email-list', projectId] as const;

const subscribeProjectToEmail = async ({
  projectId,
  email,
}: {
  projectId: string;
  email: string;
}): Promise<SubscribeOutcome> => {
  try {
    await alertsApi.create({
      channel: AlertChannel.EMAIL,
      projectId,
      receiver: email,
    });
    return 'subscribed';
  } catch (error) {
    if (api.isApError(error, ErrorCode.EXISTING_ALERT_CHANNEL)) {
      return 'already-subscribed';
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
}): Promise<UnsubscribeOutcome> => {
  const page = await alertsApi.list({ projectId, limit: ALERTS_LIST_LIMIT });
  const matches = page.data.filter(
    (alert) =>
      alert.channel === AlertChannel.EMAIL &&
      alert.receiver.toLowerCase() === lowerEmail,
  );
  if (matches.length === 0) {
    return 'not-subscribed';
  }
  await Promise.all(matches.map((alert) => alertsApi.delete(alert.id)));
  return 'unsubscribed';
};

const countOutcome = <T extends string>(
  results: PromiseSettledResult<T>[],
  outcome: T,
): number =>
  results.reduce(
    (n, r) => n + (r.status === 'fulfilled' && r.value === outcome ? 1 : 0),
    0,
  );

const ALERTS_LIST_LIMIT = 100;

type CreateAlertParams = {
  onSuccess?: () => void;
  form?: UseFormReturn<any>;
};

type BulkAlertParams = {
  email: string;
  projects: ProjectWithLimits[];
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
