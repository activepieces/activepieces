import {
  FlowApprovalRequest,
  FlowApprovalRequestState,
  ListFlowApprovalRequestsQuery,
  PopulatedFlowApprovalRequest,
  RejectFlowApprovalRequestBody,
  SeekPage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const flowApprovalsApi = {
  list(query: ListFlowApprovalRequestsQuery) {
    return api.get<SeekPage<PopulatedFlowApprovalRequest>>(
      '/v1/flow-approval-requests',
      query,
    );
  },
  approve(id: string) {
    return api.post<FlowApprovalRequest>(
      `/v1/flow-approval-requests/${id}/approve`,
      {},
    );
  },
  reject(id: string, body: RejectFlowApprovalRequestBody) {
    return api.post<FlowApprovalRequest>(
      `/v1/flow-approval-requests/${id}/reject`,
      body,
    );
  },
  withdraw(id: string) {
    return api.post<void>(`/v1/flow-approval-requests/${id}/withdraw`, {});
  },
};

export type {
  FlowApprovalRequest,
  FlowApprovalRequestState,
  PopulatedFlowApprovalRequest,
};
