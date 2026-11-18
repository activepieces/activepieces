import { SeekPage } from '@activepieces/core-utils';
import {
  GetFlowTemplateRequestQuery,
  CreateFlowRequest,
  FlowOperationRequest,
  FlowVersion,
  FlowVersionMetadata,
  GetFlowQueryParamsRequest,
  ListFlowVersionRequest,
  ListFlowsRequest,
  PopulatedFlow,
  SharedTemplate,
  CountFlowsRequest,
} from '@activepieces/shared';

import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { api } from '@/lib/api';

export const flowsApi = {
  list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
    return api.get<SeekPage<PopulatedFlow>>('/v1/flows', request);
  },
  create(request: CreateFlowRequest) {
    return api.post<PopulatedFlow>('/v1/flows', request).then((flow) => {
      projectCollectionUtils.markFlowActivity({
        projectId: flow.projectId,
        lastFlowUpdated: flow.updated,
      });
      return flow;
    });
  },
  update(flowId: string, request: FlowOperationRequest) {
    return api
      .post<PopulatedFlow>(`/v1/flows/${flowId}`, request)
      .then((flow) => {
        projectCollectionUtils.markFlowActivity({
          projectId: flow.projectId,
          lastFlowUpdated: flow.updated,
        });
        return flow;
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
    return api.delete<void>(`/v1/flows/${flowId}`).then(() => {
      return projectCollectionUtils.refetchProjects();
    });
  },
  count(query: CountFlowsRequest) {
    return api.get<number>('/v1/flows/count', query);
  },
};
