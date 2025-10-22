import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { Alert, AlertChannel, ApplicationEventName } from '@activepieces/ee-shared';
import { alertsApi } from './api';
import { CreateAlertParams, UpdateAlertParams } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const alertsKeys = {
  all: ['alerts-email-list'] as const,
};

export type MutateAlertParams = CreateAlertParams | ( UpdateAlertParams & { id: string } );
type Options = {
  setOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
};

export const alertMutations = {
  useMutateAlert: ({ setOpen, form }: Options) => {
    const queryClient = useQueryClient();
    return useMutation<Alert, Error, MutateAlertParams>({
      mutationFn: (params) => {
        if ('id' in params) {
          return alertsApi.update(params.id, params);
        } else {
          return alertsApi.create(params);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: alertsKeys.all });
        toast({
          title: t('Success'), 
          description: t('Your changes have been saved.'),
        });
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
    useQuery<SeekPage<Alert>, Error>({
      queryKey: alertsKeys.all,
      queryFn: async () =>
         await alertsApi.list({
          projectId: authenticationSession.getProjectId()!,
          limit: 100,
        })
    }),
};
