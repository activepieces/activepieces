import { isNil, SeekPage } from '@activepieces/core-utils';
import {
  getAuthPropertyForValue,
  PieceAuthProperty,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  ListAppConnectionsRequestQuery,
  PLACEHOLDER_CONNECTION_TYPE,
  ReplaceAppConnectionsRequestBody,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { useEmbedding } from '@/components/providers/embed-provider';
import { projectMembersApi } from '@/features/members/api/project-members-api';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { appConnectionsApi } from '../api/app-connections';
import { globalConnectionsApi } from '../api/global-connections';
import {
  appConnectionUtils,
  ConnectionNameAlreadyExists,
  NoProjectSelected,
  isConnectionNameUnique,
} from '../utils/utils';

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
      preSelectForNewProjects: boolean;
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
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async () => {
        setErrorMessage('');
        const formValues = form.getValues().request;
        const isNameUnique = await isConnectionNameUnique({
          isGlobalConnection,
          displayName: formValues.displayName,
          projectId: formValues.projectId,
        });
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
          if (formValues.type === PLACEHOLDER_CONNECTION_TYPE) {
            throw new Error(
              'Placeholder connections are only supported at the project scope.',
            );
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
        queryClient
          .invalidateQueries({ queryKey: ['app-connections'] })
          .catch(() => undefined);
        setOpen(false, connection);
        setErrorMessage('');
        toast.success(
          reconnectConnection
            ? t('{name} reconnected', { name: connection.displayName })
            : t('{name} connected', { name: connection.displayName }),
        );
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
        } else {
          mutationFeedback.markShown(err);
          setErrorMessage(appConnectionUtils.upsertErrorMessage(err));
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
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the connections"),
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
        const existingConnection = await isConnectionNameUnique({
          isGlobalConnection: false,
          displayName,
        });
        if (!existingConnection && displayName !== currentName) {
          throw new ConnectionNameAlreadyExists();
        }
        return appConnectionsApi.update(connectionId, { displayName });
      },
      onSuccess: () => {
        refetch();
        toast.success(t('Success'), {
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
          mutationFeedback.markShown(error);
          renameConnectionForm.setError('root.serverError', {
            type: 'manual',
            message: mutationFeedback.message(error),
          });
        }
      },
    });
  },

  useRevalidateConnection: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (connectionId: string) =>
        appConnectionsApi.revalidate(connectionId),
      onSuccess: (connection) => {
        queryClient.setQueriesData<SeekPage<AppConnectionWithoutSensitiveData>>(
          { queryKey: ['app-connections'] },
          (page) =>
            page && {
              ...page,
              data: page.data.map((row) =>
                row.id === connection.id
                  ? { ...row, status: connection.status }
                  : row,
              ),
            },
        );
        appConnectionUtils.showRevalidationResult({
          status: connection.status,
          failureDescription: t(
            'This connection is no longer working. Reconnect it.',
          ),
        });
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't check the connection"),
        });
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
        toast.success(t('Success'), {
          description: t('Connections replaced successfully'),
        });
        setDialogOpen(false);
        refetch();
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't replace the connections"),
        }),
    });
  },
};

type UseConnectionsProps = {
  request: ListAppConnectionsRequestQuery;
  extraKeys: any[];
  enabled?: boolean;
  staleTime?: number;
  pieceAuth?: PieceAuthProperty | PieceAuthProperty[] | undefined;
};

export const appConnectionsQueries = {
  useAppConnections: ({
    request,
    extraKeys,
    enabled,
    staleTime,
    pieceAuth,
  }: UseConnectionsProps) => {
    return useQuery({
      queryKey: ['app-connections', ...extraKeys],
      queryFn: async () => {
        const connections = await appConnectionsApi.list(request);
        if (pieceAuth) {
          return {
            ...connections,
            data: connections.data.filter(
              (connection) =>
                !isNil(
                  getAuthPropertyForValue({
                    authValueType: connection.type,
                    pieceAuth,
                  }),
                ),
            ),
          };
        }
        return connections;
      },
      enabled,
      staleTime,
    });
  },

  useListSearchParams: () => {
    const { search } = useLocation();
    return useMemo(() => {
      const sp = new URLSearchParams(search);
      const limitParam = sp.get(LIMIT_QUERY_PARAM);
      return {
        cursor: sp.get(CURSOR_QUERY_PARAM) ?? undefined,
        limit: limitParam ? parseInt(limitParam) : 10,
        displayName: sp.get('displayName') ?? undefined,
        ownerEmails: sp.getAll('owner'),
        status: sp.getAll('status') as AppConnectionStatus[],
        pieceName: sp.get('pieceName') ?? undefined,
      };
    }, [search]);
  },

  useConnectionsOwners: () => {
    const projectId = authenticationSession.getProjectId() ?? '';
    const isEmbedding = useEmbedding().embedState.isEmbedded;

    return useQuery({
      queryKey: ['app-connections-owners', projectId],
      queryFn: async () => {
        const { data: owners } = await appConnectionsApi.getOwners({
          projectId,
        });
        const { data: projectMembers } = await projectMembersApi.list({
          projectId,
        });
        if (isEmbedding) {
          return owners.filter(
            (owner) =>
              !isNil(
                projectMembers.find(
                  (member) => member.user.email === owner.email,
                ),
              ),
          );
        }

        return owners;
      },
    });
  },
};
