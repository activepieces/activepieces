import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import {
  CreateFlowRequest,
  ErrorCode,
  FlowOperationRequest,
  FlowTemplate,
  FlowVersion,
  FlowVersionMetadata,
  GetFlowQueryParamsRequest,
  GetFlowTemplateRequestQuery,
  ListFlowVersionRequest,
  ListFlowsRequest,
  PopulatedFlow,
  SeekPage,
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
            toast({
              title: t('Flow Is In Use'),
              description: t(
                'Flow is being used by another user, please try again later.',
              ),
              duration: Infinity,
              action: (
                <Button
                  onClick={() => window.location.reload()}
                  size={'sm'}
                  variant={'outline'}
                >
                  {t('Refresh')}
                </Button>
              ),
            });
          } else {
            toast(UNSAVED_CHANGES_TOAST);
          }
        }
        throw error;
      });
  },
  getTemplate(flowId: string, request: GetFlowTemplateRequestQuery) {
    return api.get<FlowTemplate>(`/v1/flows/${flowId}/template`, {
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
  count() {
    return api.get<number>('/v1/flows/count');
  },
};
