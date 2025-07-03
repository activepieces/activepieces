import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { downloadFile } from '@/lib/utils';
import {
  ApFlagId,
  ErrorCode,
  FlowOperationType,
  FlowStatus,
  FlowVersion,
  FlowVersionMetadata,
  ListFlowsRequest,
  PopulatedFlow,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { flowsApi } from './flows-api';
import { flowsUtils } from './flows-utils';

export const flowsHooks = {
  useFlows: (request: Omit<ListFlowsRequest, 'projectId'>) => {
    return useQuery({
      queryKey: ['flows', authenticationSession.getProjectId()],
      queryFn: async () => {
        return await flowsApi.list({
          ...request,
          projectId: authenticationSession.getProjectId()!,
        });
      },
      staleTime: 5 * 1000,
    });
  },
  usePublishFlow: ({
    flowId,
    setFlow,
    setVersion,
    showUpgradeDialog,
    setIsPublishing,
  }: {
    flowId: string;
    setFlow: (flow: PopulatedFlow) => void;
    setVersion: (version: FlowVersion) => void;
    showUpgradeDialog: () => void;
    setIsPublishing: (isPublishing: boolean) => void;
  }) => {
    const { data: enableFlowOnPublish } = flagsHooks.useFlag<boolean>(
      ApFlagId.ENABLE_FLOW_ON_PUBLISH,
    );

    return useMutation({
      mutationFn: async () => {
        setIsPublishing(true);
        return flowsApi.update(flowId, {
          type: FlowOperationType.LOCK_AND_PUBLISH,
          request: {
            status: enableFlowOnPublish
              ? FlowStatus.ENABLED
              : FlowStatus.DISABLED,
          },
        });
      },
      onSuccess: (flow) => {
        toast({
          title: t('Success'),
          description: t('Flow has been published.'),
        });
        setFlow(flow);
        setVersion(flow.version);
        setIsPublishing(false);
      },
      onError: (err: Error) => {
        if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
          showUpgradeDialog();
        } else {
          toast(INTERNAL_ERROR_TOAST);
        }
        setIsPublishing(false);
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
          toast({
            title: t('Success'),
            description:
              res.length === 1
                ? t(`${res[0].version.displayName} has been exported.`)
                : t('Flows have been exported.'),
            duration: 3000,
          });
        }
      },
      onError: () => toast(INTERNAL_ERROR_TOAST),
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
      onError: (error) => {
        toast(INTERNAL_ERROR_TOAST);
        console.error(error);
      },
    });
  },
  useOverWriteDraftWithVersion: ({
    onSuccess,
  }: {
    onSuccess: (flowVersion: PopulatedFlow) => void;
  }) => {
    return useMutation<PopulatedFlow, Error, FlowVersionMetadata>({
      mutationFn: async (flowVersion) => {
        const result = await flowsApi.update(flowVersion.flowId, {
          type: FlowOperationType.USE_AS_DRAFT,
          request: {
            versionId: flowVersion.id,
          },
        });
        return result;
      },
      onSuccess,
      onError: (error) => {
        toast(INTERNAL_ERROR_TOAST);
        console.error(error);
      },
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
            type: TriggerType.PIECE,
            pieceMetadata: stepUtils.mapPieceToMetadata({
              piece: mcpPiece,
              type: 'trigger',
            }),
          },
        }) as Trigger;
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
        return await flowsApi.get(flowId);
      },
      staleTime: 0,
    });
  },
};
