import {
  Alert,
  AlertChannel,
  ErrorCode,
  ProjectWithLimits,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import pLimit from 'p-limit';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { alertsApi } from '../api/alerts-api';

export const alertMutations = {
  useCreateAlert: (options?: Options) => {
    const queryClient = useQueryClient();
    const projectId = authenticationSession.getProjectId()!;
    return useMutation<Alert, Error, Params>({
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
        options?.onSuccess?.();
      },
      onError: (error) => {
        if (api.isError(error)) {
          switch (error.response?.status) {
            case HttpStatusCode.Conflict:
              options?.form?.setError('root.serverError', {
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
                  if (api.isApError(error, ErrorCode.EXISTING_ALERT_CHANNEL)) {
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

const MAX_PARALLEL_REQUESTS = 5;
const ALERTS_LIST_LIMIT = 100;

type Params = {
  email: string;
};

type Options = {
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
