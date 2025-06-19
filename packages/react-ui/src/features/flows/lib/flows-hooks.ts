import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import { downloadFile } from '@/lib/utils';
import {
  FlowOperationType,
  FlowVersion,
  FlowVersionMetadata,
  ListFlowsRequest,
  PopulatedFlow,
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
    setIsPublishing,
  }: {
    flowId: string;
    setFlow: (flow: PopulatedFlow) => void;
    setVersion: (version: FlowVersion) => void;
    setIsPublishing: (isPublishing: boolean) => void;
  }) => {
    return useMutation({
      mutationFn: async () => {
        setIsPublishing(true);
        return flowsApi.update(flowId, {
          type: FlowOperationType.LOCK_AND_PUBLISH,
          request: {},
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
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
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
};
