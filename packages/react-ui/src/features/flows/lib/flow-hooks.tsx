import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';
import { useSocket } from '@/components/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { downloadFile, NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import {
  ApFlagId,
  FlowOperationType,
  FlowRun,
  FlowStatus,
  FlowVersion,
  FlowVersionMetadata,
  ListFlowsRequest,
  PopulatedFlow,
  FlowTrigger,
  FlowTriggerType,
  WebsocketClientEvent,
  FlowStatusUpdatedResponse,
  isNil,
  ErrorCode,
  SeekPage,
  UncategorizedFolderId,
} from '@activepieces/shared';

import { flowsApi } from './flows-api';
import { flowsUtils } from './flows-utils';

const createFlowsQueryKey = (projectId: string) => ['flows', projectId];
export const flowHooks = {
  invalidateFlowsQuery: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: createFlowsQueryKey(authenticationSession.getProjectId()!),
    });
  },
  useFlows: (request: Omit<ListFlowsRequest, 'projectId'>) => {
    return useQuery({
      queryKey: createFlowsQueryKey(authenticationSession.getProjectId()!),
      queryFn: async () => {
        return await flowsApi.list({
          ...request,
          projectId: authenticationSession.getProjectId()!,
        });
      },
      staleTime: 5 * 1000,
    });
  },
  useChangeFlowStatus: ({
    flowId,
    change,
    onSuccess,
    setIsPublishing,
  }: UseChangeFlowStatusParams) => {
    const { data: enableFlowOnPublish } = flagsHooks.useFlag<boolean>(
      ApFlagId.ENABLE_FLOW_ON_PUBLISH,
    );
    const socket = useSocket();
    const { openDialog } = useApErrorDialogStore();
    return useMutation({
      mutationFn: async () => {
        if (change === 'publish') {
          setIsPublishing?.(true);
        }
        return await new Promise<FlowStatusUpdatedResponse>(
          (resolve, reject) => {
            const onUpdateFinish = (response: FlowStatusUpdatedResponse) => {
              if (response.flow.id !== flowId) {
                return;
              }
              socket.off(
                WebsocketClientEvent.FLOW_STATUS_UPDATED,
                onUpdateFinish,
              );
              resolve(response);
            };
            socket.on(WebsocketClientEvent.FLOW_STATUS_UPDATED, onUpdateFinish);
            flowsApi
              .update(flowId, {
                type:
                  change === 'publish'
                    ? FlowOperationType.LOCK_AND_PUBLISH
                    : FlowOperationType.CHANGE_STATUS,
                request: {
                  status:
                    change === 'publish'
                      ? enableFlowOnPublish
                        ? FlowStatus.ENABLED
                        : FlowStatus.DISABLED
                      : change,
                },
              })
              .then(() => {})
              .catch((error) => {
                reject(error);
              });
          },
        );
      },
      onSuccess: (response: FlowStatusUpdatedResponse) => {
        if (change === 'publish') {
          setIsPublishing?.(false);
        }
        if (!isNil(response.error)) {
          openDialog({
            title:
              change === 'publish'
                ? t('Publish failed')
                : t('Status update failed'),
            description: (
              <p>
                {t(
                  'An error occurred while changing the flow status. This may be due to an issue in the trigger piece or its settings.',
                )}
              </p>
            ),
            error: {
              standardError: response.error.params.standardError,
              standardOutput: response.error.params.standardOutput || '',
            },
          });
          return;
        }
        onSuccess?.(response);
      },
      onError: (error: unknown) => {
        const errorCode = (error as any)?.response?.data?.code;
        const errorMessage = (error as any)?.response?.data?.params?.message;

        if (
          errorCode === ErrorCode.FLOW_OPERATION_IN_PROGRESS &&
          errorMessage
        ) {
          toast.error(t('Flow Is Busy'), {
            description: errorMessage,
            duration: 5000,
          });
        } else {
          internalErrorToast();
        }
      },
    });
  },
  useExportFlows: () => {
    return useMutation({
      mutationFn: async (flows: PopulatedFlow[]) => {
        if (flows.length === 0) {
          return flows;
        }
        if (flows.length === 1) {
          await flowsUtils.downloadFlow(flows[0].id);
          return flows;
        }
        await downloadFile({
          obj: await flowsUtils.zipFlows(flows),
          fileName: 'flows',
          extension: 'zip',
        });
        return flows;
      },
      onSuccess: (res) => {
        if (res.length > 0) {
          toast.success(
            res.length === 1
              ? t(`${res[0].version.displayName} has been exported.`)
              : t('Flows have been exported.'),
            {
              duration: 3000,
            },
          );
        }
      },
    });
  },

  useFetchFlowVersion: ({
    onSuccess,
  }: {
    onSuccess: (flowVersion: FlowVersion) => void;
  }) => {
    return useMutation<FlowVersion, Error, FlowVersionMetadata>({
      mutationFn: async (flowVersion) => {
        const result = await flowsApi.get(flowVersion.flowId, {
          versionId: flowVersion.id,
        });
        return result.version;
      },
      onSuccess,
    });
  },
  useOverWriteDraftWithVersion: ({
    onSuccess,
  }: {
    onSuccess: (flow: PopulatedFlow) => void;
  }) => {
    return useMutation<
      PopulatedFlow,
      Error,
      { flowId: string; versionId: string }
    >({
      mutationFn: async ({ flowId, versionId }) => {
        const result = await flowsApi.update(flowId, {
          type: FlowOperationType.USE_AS_DRAFT,
          request: {
            versionId,
          },
        });
        return result;
      },
      onSuccess,
    });
  },
  useCreateMcpFlow: () => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: async () => {
        const flow = await flowsApi.create({
          projectId: authenticationSession.getProjectId()!,
          displayName: t('Untitled'),
        });
        const mcpPiece = await piecesApi.get({
          name: '@activepieces/piece-mcp',
        });
        const trigger = mcpPiece.triggers['mcp_tool'];
        if (!trigger) {
          throw new Error('MCP trigger not found');
        }
        const stepData = pieceSelectorUtils.getDefaultStepValues({
          stepName: 'trigger',
          pieceSelectorItem: {
            actionOrTrigger: trigger,
            type: FlowTriggerType.PIECE,
            pieceMetadata: stepUtils.mapPieceToMetadata({
              piece: mcpPiece,
              type: 'trigger',
            }),
          },
        }) as FlowTrigger;
        await flowsApi.update(flow.id, {
          type: FlowOperationType.UPDATE_TRIGGER,
          request: stepData,
        });
        return flow;
      },
      onSuccess: (flow) => {
        navigate(`/flows/${flow.id}/`);
      },
    });
  },
  useGetFlow: (flowId: string) => {
    return useQuery({
      queryKey: ['flow', flowId],
      queryFn: async () => {
        try {
          return await flowsApi.get(flowId);
        } catch (err) {
          console.error(err);
          return null;
        }
      },
      staleTime: 0,
    });
  },
  useTestFlow: ({
    flowVersionId,
    onUpdateRun,
  }: {
    flowVersionId: string;
    onUpdateRun: (run: FlowRun) => void;
  }) => {
    const socket = useSocket();
    return useMutation<void>({
      mutationFn: () =>
        flowRunsApi.testFlow(
          socket,
          {
            flowVersionId,
          },
          onUpdateRun,
        ),
    });
  },
  useListFlowVersions: (flowId: string) => {
    return useQuery<SeekPage<FlowVersionMetadata>, Error>({
      queryKey: ['flow-versions', flowId],
      queryFn: () =>
        flowsApi.listVersions(flowId, {
          limit: 1000,
          cursor: undefined,
        }),
      staleTime: 0,
    });
  },
  useGetFlowVersionNumber: ({
    flowId,
    versionId,
  }: {
    flowId: string;
    versionId: string;
  }) => {
    const { data: flowVersions } = flowHooks.useListFlowVersions(flowId);
    return flowVersions?.data
      ? flowVersions.data.length -
          flowVersions.data.findIndex((version) => version.id === versionId)
      : '';
  },
  useStartFromScratch: (folderId: string) => {
    const navigate = useNavigate();
    return useMutation<PopulatedFlow, Error, void>({
      mutationFn: async () => {
        const folder =
          folderId !== UncategorizedFolderId
            ? await foldersApi.get(folderId)
            : undefined;
        const flow = await flowsApi.create({
          projectId: authenticationSession.getProjectId()!,
          displayName: t('Untitled'),
          folderName: folder?.displayName,
        });
        return flow;
      },
      onSuccess: (flow) => {
        navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
      },
    });
  },
};

type UseChangeFlowStatusParams = {
  flowId: string;
  change: 'publish' | FlowStatus;
  onSuccess: (flow: FlowStatusUpdatedResponse) => void;
  setIsPublishing?: (isPublishing: boolean) => void;
};
