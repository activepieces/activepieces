import {
  ApErrorParams,
  ApFlagId,
  FlowOperationType,
  FlowStatus,
  FlowVersion,
  FlowVersionMetadata,
  FlowVersionTemplate,
  ListFlowsRequest,
  PopulatedFlow,
  FlowTrigger,
  FlowTriggerType,
  isNil,
  ErrorCode,
  SeekPage,
  Template,
  UncategorizedFolderId,
  UpdateRunProgressRequest,
} from '@activepieces/shared';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';
import { useSocket } from '@/components/providers/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunsApi } from '@/features/flow-runs/api/flow-runs-api';
import { foldersApi } from '@/features/folders/api/folders-api';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { pieceSelectorUtils } from '@/features/pieces/utils/piece-selector-utils';
import { stepUtils } from '@/features/pieces/utils/step-utils';
import { templatesApi } from '@/features/templates/api/templates-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { downloadFile } from '@/lib/dom-utils';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';

import { flowsApi } from '../api/flows-api';
import { flowsUtils } from '../utils/flows-utils';

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
    const { data: triggerTimeout } = flagsHooks.useFlag<number>(
      ApFlagId.TRIGGER_TIMEOUT_SECONDS,
    );
    const { openDialog } = useApErrorDialogStore();
    return useMutation({
      mutationFn: async () => {
        if (change === 'publish') {
          setIsPublishing?.(true);
        }
        return flowsApi.update(flowId, {
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
        });
      },
      onSuccess: (flow: PopulatedFlow) => {
        if (change === 'publish') {
          setIsPublishing?.(false);
        }
        onSuccess?.(flow);
      },
      onError: (error: unknown) => {
        if (change === 'publish') {
          setIsPublishing?.(false);
        }
        if (!api.isError(error)) {
          internalErrorToast();
          return;
        }
        if (
          !error.response ||
          error.response.status === api.httpStatus.GatewayTimeout
        ) {
          toast.error(t('Request Timed Out'), {
            description: t(
              'The operation exceeded the {timeout} second timeout. Please refresh and try again.',
              { timeout: triggerTimeout ?? 60 },
            ),
            duration: 5000,
          });
          return;
        }
        const apError = error.response.data as ApErrorParams;
        if (apError.code === ErrorCode.TRIGGER_UPDATE_STATUS) {
          const params = apError.params as Record<string, string>;
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
              standardError: params.standardError || '',
              standardOutput: params.standardOutput || '',
            },
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
  useUpdateFlowOwner: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation<
      PopulatedFlow,
      Error,
      { flowId: string; ownerId: string }
    >({
      mutationFn: async ({ flowId, ownerId }) => {
        return await flowsApi.update(flowId, {
          type: FlowOperationType.UPDATE_OWNER,
          request: { ownerId },
        });
      },
      onSuccess,
    });
  },
  useCreateTemplateFromFlow: ({
    onSuccess,
  }: {
    onSuccess: (template: Template) => void;
  }) => {
    return useMutation<
      Template,
      Error,
      {
        flowId: string;
        flowVersionId: string;
        description: string;
        author: string;
      }
    >({
      mutationFn: async ({ flowId, flowVersionId, description, author }) => {
        const template = await flowsApi.getTemplate(flowId, {
          versionId: flowVersionId,
        });
        const flowTemplate = await templatesApi.create({
          name: template.name,
          description,
          summary: template.summary,
          tags: template.tags,
          blogUrl: template.blogUrl ?? undefined,
          metadata: template.metadata,
          author,
          categories: template.categories,
          type: template.type,
          flows: template.flows,
        });
        return flowTemplate;
      },
      onSuccess,
    });
  },
  useTestFlowOrStartManualTrigger: ({
    flowVersionId,
    onUpdateRun,
    isForManualTrigger,
  }: {
    flowVersionId: string;
    onUpdateRun: (stepResponse: UpdateRunProgressRequest) => void;
    isForManualTrigger: boolean;
  }) => {
    const socket = useSocket();
    return useMutation<void>({
      mutationFn: () =>
        flowRunsApi.subscribeToTestFlowOrManualRun(
          socket,
          {
            flowVersionId,
          },
          onUpdateRun,
          isForManualTrigger,
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
  importFlowIntoExisting: async ({
    template,
    existingFlowId,
  }: {
    template: Template;
    existingFlowId: string;
  }): Promise<PopulatedFlow> => {
    const flows = template.flows || [];
    if (flows.length === 0) {
      throw new Error('Template has no flows');
    }

    const templateFlow = flows[0];
    const flow = await flowsApi.get(existingFlowId);

    const oldExternalId = !isNil(template.metadata?.externalId)
      ? (template.metadata['externalId'] as string)
      : flow.externalId;

    const triggerString = JSON.stringify(templateFlow.trigger).replaceAll(
      oldExternalId,
      flow.externalId,
    );
    const updatedTrigger = JSON.parse(triggerString);

    return await flowsApi.update(flow.id, {
      type: FlowOperationType.IMPORT_FLOW,
      request: {
        displayName: templateFlow.displayName,
        trigger: updatedTrigger,
        schemaVersion: templateFlow.schemaVersion,
      },
    });
  },
  importFlowsFromTemplates: async ({
    templates,
    projectId,
    folderName,
  }: {
    templates: Template[];
    projectId: string;
    folderName?: string;
  }): Promise<PopulatedFlow[]> => {
    if (templates.length === 0) {
      return [];
    }

    const allFlowsToImport: Array<{
      flow: PopulatedFlow;
      templateFlow: FlowVersionTemplate;
      oldExternalId: string;
    }> = [];

    for (const template of templates) {
      const flows = template.flows || [];
      if (flows.length === 0) {
        continue;
      }

      for (const templateFlow of flows) {
        const flow = await flowsApi.create({
          displayName: templateFlow.displayName,
          templateId: template.id,
          projectId,
          folderName,
        });

        const oldExternalId = !isNil(template.metadata?.externalId)
          ? (template.metadata['externalId'] as string)
          : flow.externalId;

        allFlowsToImport.push({
          flow,
          templateFlow,
          oldExternalId,
        });
      }
    }

    const externalIdMap = new Map<string, string>();
    for (const { oldExternalId, flow } of allFlowsToImport) {
      externalIdMap.set(oldExternalId, flow.externalId);
    }

    const importPromises = allFlowsToImport.map(
      async ({ flow, templateFlow }) => {
        let triggerString = JSON.stringify(templateFlow.trigger);

        for (const [oldId, newId] of externalIdMap.entries()) {
          triggerString = triggerString.replaceAll(oldId, newId);
        }

        const updatedTrigger = JSON.parse(triggerString);

        return await flowsApi.update(flow.id, {
          type: FlowOperationType.IMPORT_FLOW,
          request: {
            displayName: templateFlow.displayName,
            trigger: updatedTrigger,
            schemaVersion: templateFlow.schemaVersion,
            notes: templateFlow.notes,
          },
        });
      },
    );

    return await Promise.all(importPromises);
  },
  useFetchNpmPackageVersion: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (result: {
      packageName: string;
      packageVersion: string;
    }) => void;
    onError: () => void;
  }) => {
    return useMutation({
      mutationFn: async (packageName: string) => {
        const response = await api.get<{ 'dist-tags': { latest: string } }>(
          `https://registry.npmjs.org/${packageName}`,
        );
        return {
          packageName,
          packageVersion: response['dist-tags'].latest,
        };
      },
      onSuccess,
      onError,
    });
  },
};

type UseChangeFlowStatusParams = {
  flowId: string;
  change: 'publish' | FlowStatus;
  onSuccess: (flow: PopulatedFlow) => void;
  setIsPublishing?: (isPublishing: boolean) => void;
};
