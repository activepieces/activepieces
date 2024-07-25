import {
  FlowRun,
  SeekPage,
  ListFlowRunsRequestQuery,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const flowRunsApi = {
  list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
    return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
  },
  getPopulated(id: string): Promise<FlowRun> {
    return api.get<FlowRun>(`/v1/flow-runs/${id}`);
  },
};
