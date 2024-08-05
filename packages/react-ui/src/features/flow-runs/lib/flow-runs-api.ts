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
  retry(id: string, strategy: string): Promise<void> {
    return api.post<void>(
      `/v1/flow-runs/${id}/retry`,
      {},
      {
        strategy,
      },
    );
  },
};
