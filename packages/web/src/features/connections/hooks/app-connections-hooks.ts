import {
  ApErrorParams,
  Permission,
  ErrorCode,
  isNil,
  SeekPage,
  unique,
} from '@activepieces/core-utils';
import {
  getAuthPropertyForValue,
  PieceAuthProperty,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  FlowVersionState,
  ListAppConnectionsRequestQuery,
  PLACEHOLDER_CONNECTION_TYPE,
  ReplaceAppConnectionsRequestBody,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/providers/embed-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { agentsApi } from '@/features/agents/api/agents';
import { useAgentsAvailable } from '@/features/agents/hooks/agents-hooks';
import { flowsApi } from '@/features/flows/api/flows-api';
import { projectMembersApi } from '@/features/members/api/project-members-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { appConnectionsApi } from '../api/app-connections';
import { globalConnectionsApi } from '../api/global-connections';
import {
  ConnectionNameAlreadyExists,
  NoProjectSelected,
  isConnectionNameUnique,
} from '../utils/utils';

type UseReplaceConnectionsProps = {
  setDialogOpen: (isOpen: boolean) => void;
  refetch: () => void;
  onReplaced?: (request: ReplaceAppConnectionsRequestBody) => void;
  connections: AppConnectionWithoutSensitiveData[];
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

function useReplaceConnectionAccess() {
  const { embedState } = useEmbedding();
  const hasPermissionToReplace = useAuthorization().checkAccess(
    Permission.REPLACE_APP_CONNECTION,
  );
  return {
    showReplace: !embedState.hideReplaceConnection,
    hasPermissionToReplace,
  };
}

export const appConnectionsHooks = {
  useReplaceConnectionAccess,
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
        // Every cached connection list is now out of date, whichever key it was fetched under.
        // Refreshing only the caller's own query left other readers stale enough to describe a
        // brand-new account as deleted.
        void queryClient.invalidateQueries({ queryKey: ['app-connections'] });
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
            case ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED: {
              setErrorMessage(
                t('Secret was not found: "{msg}"', {
                  msg: apError.params.message,
                }),
              );
              break;
            }
            case ErrorCode.SECRET_MANAGER_CONNECTION_FAILED: {
              setErrorMessage(
                t('Failed to connect to secret manager with error: "{msg}"', {
                  msg: apError.params.message,
                }),
              );
              break;
            }
            case ErrorCode.VALIDATION: {
              setErrorMessage(
                t('Validation error: {msg}', {
                  msg: apError.params.message,
                }),
              );
              break;
            }

            default: {
              setErrorMessage('Unexpected error, please contact support');
              internalErrorToast();
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
        internalErrorToast();
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
          internalErrorToast();
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
        if (connection.status === AppConnectionStatus.ACTIVE) {
          toast.success(t('Success'), {
            description: t('Connection is working.'),
            duration: 3000,
          });
        } else {
          toast.error(t('Connection failed'), {
            description: t(
              'This connection is no longer working. Reconnect it.',
            ),
            duration: 3000,
          });
        }
      },
      onError: () => {
        internalErrorToast();
      },
    });
  },

  useReplaceConnections: ({
    setDialogOpen,
    refetch,
    onReplaced,
    connections,
  }: UseReplaceConnectionsProps) => {
    return useMutation({
      mutationFn: async (request: ReplaceAppConnectionsRequestBody) => {
        await appConnectionsApi.replace(request);
      },
      onSuccess: (_, request) => {
        const displayNameOf = (id: string) =>
          connections.find((connection) => connection.id === id)?.displayName ??
          id;
        toast.success(t('Success'), {
          description: t(
            'Replaced connection {sourceName} with connection {targetName}',
            {
              sourceName: displayNameOf(request.sourceAppConnectionId),
              targetName: displayNameOf(request.targetAppConnectionId),
            },
          ),
        });
        onReplaced?.(request);
        setDialogOpen(false);
        refetch();
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (
            apError?.code === ErrorCode.VALIDATION ||
            apError?.code === ErrorCode.AUTHORIZATION
          ) {
            toast.error(t('Error'), {
              description: t(
                apError.params.message ?? 'Failed to replace connections',
              ),
            });
            return;
          }
        }
        toast.error(t('Error'), {
          description: t('Failed to replace connections'),
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

  useFlowsAndAgentsUsingConnections: ({
    connections,
    enabled,
  }: {
    connections: ConnectionToCheck[];
    enabled: boolean;
  }) => {
    const agentsAvailable = useAgentsAvailable();
    return useQuery({
      queryKey: ['app-connection-usage', connections, agentsAvailable],
      queryFn: () =>
        listFlowsAndAgentsUsingConnections({
          connections,
          agentsAvailable,
        }),
      enabled,
      staleTime: 0,
      gcTime: 0,
    });
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

async function listFlowsAndAgentsUsingConnections({
  connections,
  agentsAvailable,
}: {
  connections: ConnectionToCheck[];
  agentsAvailable: boolean;
}) {
  const projectIds = unique(
    connections.flatMap((connection) => connection.projectIds),
  );
  const usagePerProject = await Promise.all(
    projectIds.map((projectId) =>
      listFlowsAndAgentsUsingConnectionsInProject({
        projectId,
        externalIds: connections
          .filter((connection) => connection.projectIds.includes(projectId))
          .map((connection) => connection.externalId),
        agentsAvailable,
      }),
    ),
  );
  return {
    flows: usagePerProject.flatMap((usage) => usage.flows),
    agents: usagePerProject.flatMap((usage) => usage.agents),
  };
}

async function listFlowsAndAgentsUsingConnectionsInProject({
  projectId,
  externalIds,
  agentsAvailable,
}: {
  projectId: string;
  externalIds: string[];
  agentsAvailable: boolean;
}) {
  const flowsRequest = {
    projectId,
    connectionExternalIds: externalIds,
    cursor: undefined,
    limit: 1000,
  };
  const [draftFlowsPage, publishedFlowsPage, agentsPage] = await Promise.all([
    flowsApi.list(flowsRequest),
    flowsApi.list({
      ...flowsRequest,
      versionState: FlowVersionState.LOCKED,
    }),
    agentsAvailable
      ? agentsApi.list({
          projectId,
          connectionExternalIds: externalIds,
          limit: 100,
        })
      : null,
  ]);
  const draftFlowIds = new Set(draftFlowsPage.data.map((flow) => flow.id));
  return {
    flows: [
      ...draftFlowsPage.data,
      ...publishedFlowsPage.data.filter((flow) => !draftFlowIds.has(flow.id)),
    ],
    agents: agentsPage?.data ?? [],
  };
}

type ConnectionToCheck = Pick<
  AppConnectionWithoutSensitiveData,
  'externalId' | 'projectIds'
>;
