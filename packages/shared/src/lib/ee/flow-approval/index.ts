import { z } from 'zod'
import { Flow, FlowStatus } from '../../automation/flows/flow'
import { FlowVersion } from '../../automation/flows/flow-version'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'

export enum FlowApprovalRequestState {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export const FlowApprovalRequest = z.object({
    ...BaseModelSchema,
    flowId: ApId,
    flowVersionId: ApId,
    projectId: ApId,
    platformId: ApId,
    submitterId: Nullable(ApId),
    submittedAt: z.string(),
    approverId: Nullable(ApId),
    decidedAt: Nullable(z.string()),
    state: z.nativeEnum(FlowApprovalRequestState),
    requestedStatus: z.nativeEnum(FlowStatus),
    rejectionReason: Nullable(z.string()),
})
export type FlowApprovalRequest = z.infer<typeof FlowApprovalRequest>

export const PopulatedFlowApprovalRequest = FlowApprovalRequest.extend({
    flow: Flow.optional(),
    flowVersion: FlowVersion.pick({ id: true, displayName: true, flowId: true, state: true, created: true, updated: true }).optional(),
})
export type PopulatedFlowApprovalRequest = z.infer<typeof PopulatedFlowApprovalRequest>

export const RejectFlowApprovalRequestBody = z.object({
    reason: z.string().max(1000).optional(),
})
export type RejectFlowApprovalRequestBody = z.infer<typeof RejectFlowApprovalRequestBody>

export const ListFlowApprovalRequestsQuery = z.object({
    state: z.nativeEnum(FlowApprovalRequestState).optional(),
    projectId: ApId.optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
})
export type ListFlowApprovalRequestsQuery = z.infer<typeof ListFlowApprovalRequestsQuery>
