import { api } from '@/lib/api';
import {
  FlowRun,
  SeekPage,
  ListFlowRunsRequestQuery,
} from '@activepieces/shared';

export const flowRunsApi = {
  list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
    return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
  },
};
