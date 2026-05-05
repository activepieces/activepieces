import {
  FlowApprovalRequest,
  FlowApprovalRequestState,
  Permission,
  RejectFlowApprovalRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { flowApprovalsApi } from '../api/flow-approvals-api';

const PENDING_BADGE_PROBE_LIMIT = 11;

export const flowApprovalsHooks = {
  useListApprovals: ({
    cursor,
    limit,
    state,
  }: {
    cursor?: string;
    limit?: number;
    state?: FlowApprovalRequestState;
  }) => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { checkAccess } = useAuthorization();
    const projectId = authenticationSession.getProjectId();
    const canApprove = checkAccess(Permission.PUBLISH_SENSITIVE_FLOW_ACCESS);
    return useQuery({
      queryKey: [
        'flow-approval-requests',
        projectId,
        state ?? 'ALL',
        cursor ?? null,
        limit ?? null,
      ],
      queryFn: () =>
        flowApprovalsApi.list({
          state,
          cursor,
          limit,
          projectId: projectId ?? undefined,
        }),
      enabled: !!projectId && platform.plan.flowApprovalEnabled && canApprove,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },
  usePendingApprovalsBadge: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { checkAccess } = useAuthorization();
    const projectId = authenticationSession.getProjectId();
    const canApprove = checkAccess(Permission.PUBLISH_SENSITIVE_FLOW_ACCESS);
    return useQuery({
      queryKey: ['flow-approval-requests', 'badge', projectId],
      queryFn: () =>
        flowApprovalsApi.list({
          state: FlowApprovalRequestState.PENDING,
          limit: PENDING_BADGE_PROBE_LIMIT,
          projectId: projectId ?? undefined,
        }),
      enabled: !!projectId && platform.plan.flowApprovalEnabled && canApprove,
    });
  },
  useApprovalForVersion: (flowVersionId: string | undefined) => {
    const { platform } = platformHooks.useCurrentPlatform();
    const projectId = authenticationSession.getProjectId();
    return useQuery({
      queryKey: ['flow-approval-requests', 'version', flowVersionId, projectId],
      queryFn: async () => {
        const page = await flowApprovalsApi.list({
          projectId: projectId ?? undefined,
          flowVersionId,
          limit: 1,
        });
        return page.data[0] ?? null;
      },
      enabled:
        !!flowVersionId && !!projectId && platform.plan.flowApprovalEnabled,
    });
  },
  useApprove: () => {
    const queryClient = useQueryClient();
    return useMutation<FlowApprovalRequest, Error, string>({
      mutationFn: (id) => flowApprovalsApi.approve(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['flow-approval-requests'] });
        queryClient.invalidateQueries({ queryKey: ['flows'] });
        toast.success(t('Approved successfully'));
      },
    });
  },
  useReject: () => {
    const queryClient = useQueryClient();
    return useMutation<
      FlowApprovalRequest,
      Error,
      { id: string; body: RejectFlowApprovalRequestBody }
    >({
      mutationFn: ({ id, body }) => flowApprovalsApi.reject(id, body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['flow-approval-requests'] });
        toast.success(t('Rejected successfully'));
      },
    });
  },
  useWithdraw: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
      mutationFn: (id) => flowApprovalsApi.withdraw(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['flow-approval-requests'] });
        queryClient.invalidateQueries({ queryKey: ['flows'] });
        toast.success(t('Withdrawn successfully'));
      },
    });
  },
};
