import {
  ApErrorParams,
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
  ErrorCode,
  isNil,
  ListAppConnectionsRequestQuery,
  ReplaceAppConnectionsRequestBody,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { appConnectionsApi } from './api/app-connections';
import { globalConnectionsApi } from './api/global-connections';
import {
  ConnectionNameAlreadyExists,
  NoProjectSelected,
  isConnectionNameUnique,
} from './utils';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type UseReplaceConnectionsProps = {
  setDialogOpen: (isOpen: boolean) => void;
  refetch: () => void;
};

type UseRenameAppConnectionProps = {
  currentName: string;
  setIsRenameDialogOpen: (isOpen: boolean) => void;
  renameConnectionForm: UseFormReturn<{
    displayName: string;
  }>;
  refetch: () => void;
};

type UseUpsertAppConnectionProps = {
  isGlobalConnection: boolean;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  externalIdComingFromSdk?: string | null;
  setErrorMessage: (message: string) => void;
  form: UseFormReturn<{
    request: UpsertAppConnectionRequestBody & {
      projectIds: string[];
    };
  }>;
  setOpen: (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => void;
};

export const appConnectionsMutations = {
  useUpsertAppConnection: ({
    isGlobalConnection,
    reconnectConnection,
    externalIdComingFromSdk,
    setErrorMessage,
    form,
    setOpen,
  }: UseUpsertAppConnectionProps) => {
    return useMutation({
      mutationFn: async () => {
        setErrorMessage('');
        const formValues = form.getValues().request;
        const isNameUnique = await isConnectionNameUnique(
          isGlobalConnection,
          formValues.displayName,
        );
        if (
          !isNameUnique &&
          reconnectConnection?.displayName !== formValues.displayName &&
          (isNil(externalIdComingFromSdk) || externalIdComingFromSdk === '')
        ) {
          throw new ConnectionNameAlreadyExists();
        }
        if (isGlobalConnection) {
          if (formValues.projectIds.length === 0) {
            throw new NoProjectSelected();
          }
          return globalConnectionsApi.upsert({
            ...formValues,
            projectIds: formValues.projectIds,
            scope: AppConnectionScope.PLATFORM,
          });
        }
        return appConnectionsApi.upsert(formValues);
      },
      onSuccess: (connection) => {
        setOpen(false, connection);
        setErrorMessage('');
      },
      onError: (err) => {
        if (err instanceof ConnectionNameAlreadyExists) {
          form.setError('request.displayName', {
            message: err.message,
          });
        } else if (err instanceof NoProjectSelected) {
          form.setError('request.projectIds', {
            message: err.message,
          });
        } else if (api.isError(err)) {
          const apError = err.response?.data as ApErrorParams;
          switch (apError.code) {
            case ErrorCode.INVALID_CLOUD_CLAIM: {
              setErrorMessage(
                t(
                  'Could not claim the authorization code, make sure you have correct settings and try again.',
                ),
              );
              break;
            }
            case ErrorCode.INVALID_CLAIM: {
              setErrorMessage(
                t('Connection failed with error {msg}', {
                  msg: apError.params.message,
                }),
              );
              break;
            }
            case ErrorCode.INVALID_APP_CONNECTION: {
              setErrorMessage(
                t('Connection failed with error {msg}', {
                  msg: apError.params.error,
                }),
              );
              break;
            }
            // can happen in embedding sdk connect method
            case ErrorCode.PERMISSION_DENIED: {
              setErrorMessage(
                t(`You don't have the permission to create a connection.`),
              );
              break;
            }

            default: {
              setErrorMessage('Unexpected error, please contact support');
              toast(INTERNAL_ERROR_TOAST);
              console.error(err);
            }
          }
        }
      },
    });
  },

  useBulkDeleteAppConnections: (refetch: () => void) => {
    return useMutation({
      mutationFn: async (ids: string[]) => {
        await Promise.all(ids.map((id) => appConnectionsApi.delete(id)));
      },
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        toast({
          title: t('Error deleting connections'),
          variant: 'destructive',
        });
      },
    });
  },

  useRenameAppConnection: ({
    currentName,
    setIsRenameDialogOpen,
    renameConnectionForm,
    refetch,
  }: UseRenameAppConnectionProps) => {
    return useMutation({
      mutationFn: async ({
        connectionId,
        displayName,
      }: {
        connectionId: string;
        displayName: string;
      }) => {
        const existingConnection = await isConnectionNameUnique(
          false,
          displayName,
        );
        if (!existingConnection && displayName !== currentName) {
          throw new ConnectionNameAlreadyExists();
        }
        return appConnectionsApi.update(connectionId, { displayName });
      },
      onSuccess: () => {
        refetch();
        toast({
          title: t('Success'),
          description: t('Connection has been renamed.'),
          duration: 3000,
        });
        setIsRenameDialogOpen(false);
      },
      onError: (error) => {
        if (error instanceof ConnectionNameAlreadyExists) {
          renameConnectionForm.setError('displayName', {
            message: error.message,
          });
        } else {
          toast(INTERNAL_ERROR_TOAST);
        }
      },
    });
  },

  useReplaceConnections: ({
    setDialogOpen,
    refetch,
  }: UseReplaceConnectionsProps) => {
    return useMutation({
      mutationFn: async (request: ReplaceAppConnectionsRequestBody) => {
        await appConnectionsApi.replace(request);
      },
      onSuccess: () => {
        toast({
          title: t('Success'),
          description: t('Connections replaced successfully'),
        });
        setDialogOpen(false);
        refetch();
      },
      onError: () => {
        toast({
          title: t('Error'),
          description: t('Failed to replace connections'),
          variant: 'destructive',
        });
      },
    });
  },
};

type UseConnectionsProps = {
  request: ListAppConnectionsRequestQuery;
  extraKeys: any[];
  enabled?: boolean;
  staleTime?: number;
};

export const appConnectionsQueries = {
  useAppConnections: ({
    request,
    extraKeys,
    enabled,
    staleTime,
  }: UseConnectionsProps) => {
    return useQuery({
      queryKey: ['app-connections', ...extraKeys],
      queryFn: () => appConnectionsApi.list(request),
      enabled,
      staleTime,
    });
  },

  useConnectionsOwners: () => {
    const projectId = authenticationSession.getProjectId() ?? '';

    return useQuery({
      queryKey: ['app-connections-owners', projectId],
      queryFn: async () => {
        const { data: owners } = await appConnectionsApi.getOwners({
          projectId,
        });

        return owners;
      },
    });
  },
};
