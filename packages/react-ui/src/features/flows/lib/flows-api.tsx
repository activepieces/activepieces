import { t } from 'i18next';
import { toast } from 'sonner';

import { UNSAVED_CHANGES_TOAST } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { GetFlowTemplateRequestQuery } from '@activepieces/ee-shared';
import {
  CreateFlowRequest,
  ErrorCode,
  FlowOperationRequest,
  FlowVersion,
  FlowVersionMetadata,
  GetFlowQueryParamsRequest,
  ListFlowVersionRequest,
  ListFlowsRequest,
  PopulatedFlow,
  SharedTemplate,
  SeekPage,
  CountFlowsRequest,
} from '@activepieces/shared';

export const flowsApi = {
  list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
    return api.get<SeekPage<PopulatedFlow>>('/v1/flows', request);
  },
  create(request: CreateFlowRequest) {
    return api.post<PopulatedFlow>('/v1/flows', request);
  },
  update(
    flowId: string,
    request: FlowOperationRequest,
    showErrorToast = false,
  ) {
    return api
      .post<PopulatedFlow>(`/v1/flows/${flowId}`, request)
      .catch((error) => {
        if (showErrorToast) {
          const errorCode: ErrorCode | undefined = (
            error.response?.data as { code: ErrorCode }
          )?.code;
          if (errorCode === ErrorCode.FLOW_IN_USE) {
            toast.error(t('Flow Is In Use'), {
              description: t(
                'Flow is being used by another user, please try again later.',
              ),
              duration: Infinity,
              action: {
                label: t('Refresh'),
                onClick: () => window.location.reload(),
              },
            });
          } else {
            toast.error(UNSAVED_CHANGES_TOAST.title, {
              description: UNSAVED_CHANGES_TOAST.description,
              duration: UNSAVED_CHANGES_TOAST.duration,
              id: UNSAVED_CHANGES_TOAST.id,
            });
          }
        }
        throw error;
      });
  },
  getTemplate(flowId: string, request: GetFlowTemplateRequestQuery) {
    return api.get<SharedTemplate>(`/v1/flows/${flowId}/template`, {
      params: request,
    });
  },
  get(
    flowId: string,
    request?: GetFlowQueryParamsRequest,
  ): Promise<PopulatedFlow> {
    return api.get<PopulatedFlow>(`/v1/flows/${flowId}`, request);
  },
  listVersions(
    flowId: string,
    request: ListFlowVersionRequest,
  ): Promise<SeekPage<FlowVersionMetadata>> {
    return api.get<SeekPage<FlowVersion>>(
      `/v1/flows/${flowId}/versions`,
      request,
    );
  },
  delete(flowId: string) {
    return api.delete<void>(`/v1/flows/${flowId}`);
  },
  count(query: CountFlowsRequest) {
    return api.get<number>('/v1/flows/count', query);
  },
};
