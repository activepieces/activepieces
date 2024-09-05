import { api } from '@/lib/api';
import {
  FlowRun,
  SeekPage,
  ListFlowRunsRequestQuery,
  RetryFlowRequestBody,
} from '@activepieces/shared';

export const flowRunsApi = {
  list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
    return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
  },
  getPopulated(id: string): Promise<FlowRun> {
    return api.get<FlowRun>(`/v1/flow-runs/${id}`);
  },
  retry(flowRunId: string, request: RetryFlowRequestBody): Promise<FlowRun> {
    return api.post<FlowRun>(`/v1/flow-runs/${flowRunId}/retry`, request);
  },
};
