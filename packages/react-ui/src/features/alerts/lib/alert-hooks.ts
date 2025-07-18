import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { Alert, AlertChannel } from '@activepieces/ee-shared';

import { alertsApi } from './api';

type Params = {
  email: string;
};

export const alertsKeys = {
  all: ['alerts-email-list'] as const,
};

type Options = {
  setOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
};

export const alertMutations = {
  useCreateAlert: ({ setOpen, form }: Options) => {
    const queryClient = useQueryClient();

    return useMutation<Alert, Error, Params>({
      mutationFn: async (params) =>
        alertsApi.create({
          receiver: params.email,
          projectId: authenticationSession.getProjectId()!,
          channel: AlertChannel.EMAIL,
        }),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: alertsKeys.all });
        toast({
          title: t('Success'),
          description: t('Your changes have been saved.'),
          duration: 3000,
        });
        setOpen(false);
      },
      onError: (error) => {
        if (api.isError(error)) {
          switch (error.response?.status) {
            case HttpStatusCode.Conflict:
              form.setError('root.serverError', {
                message: t('The email is already added.'),
              });
              break;
            default: {
              toast(INTERNAL_ERROR_TOAST);
              break;
            }
          }
        }
      },
    });
  },
  useDeleteAlert: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, Alert>({
      mutationFn: (alert) => alertsApi.delete(alert.id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: alertsKeys.all });
        toast({
          title: t('Success'),
          description: t('Your changes have been saved.'),
          duration: 3000,
        });
      },
    });
  },
};

export const alertQueries = {
  useAlertsEmailList: () =>
    useQuery<Alert[], Error, Alert[]>({
      queryKey: alertsKeys.all,
      queryFn: async () => {
        const page = await alertsApi.list({
          projectId: authenticationSession.getProjectId()!,
          limit: 100,
        });
        return page.data;
      },
    }),
};
