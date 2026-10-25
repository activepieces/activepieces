import { WorkerGroupScope } from '@activepieces/core-execution'
import { ApId } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

export const WORKER_GROUP_ASSIGNMENTS_MAX_PAGE_SIZE = 100
export const WORKER_GROUP_BULK_ASSIGN_MAX_ITEMS = 500

const WorkerGroupLabel = z.string().min(1).max(128)

export const WorkerGroupSummary = z.object({
    label: z.string(),
    scope: z.enum([WorkerGroupScope.PROJECT, WorkerGroupScope.FLOW]),
    online: z.number(),
    slots: z.number(),
    waiting: z.number(),
    projectCount: z.number(),
    flowCount: z.number(),
    sample: z.array(z.string()),
})
export type WorkerGroupSummary = z.infer<typeof WorkerGroupSummary>

export const WorkerGroupsOverview = z.object({
    defaultGroup: z.object({
        online: z.number(),
        slots: z.number(),
        projectCount: z.number(),
        flowCount: z.number(),
        sample: z.array(z.string()),
    }),
    groups: z.array(WorkerGroupSummary),
})
export type WorkerGroupsOverview = z.infer<typeof WorkerGroupsOverview>

const PageQuery = {
    search: z.string().max(100).optional(),
    cursor: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(WORKER_GROUP_ASSIGNMENTS_MAX_PAGE_SIZE).default(50),
    exclude: WorkerGroupLabel.optional(),
}

export const ListWorkerGroupProjectsRequest = z.object({
    group: WorkerGroupLabel.optional(),
    filter: z.enum(['all', 'shared']).optional(),
    ...PageQuery,
}).refine((request) => request.group !== undefined || request.filter !== undefined, {
    message: formErrors.required,
})
export type ListWorkerGroupProjectsRequest = z.infer<typeof ListWorkerGroupProjectsRequest>

export const ListWorkerGroupFlowsRequest = z.object({
    group: WorkerGroupLabel.optional(),
    filter: z.enum(['all', 'pinned']).optional(),
    projectId: z.optional(ApId),
    ...PageQuery,
}).refine((request) => request.group !== undefined || request.filter !== undefined || request.projectId !== undefined, {
    message: formErrors.required,
})
export type ListWorkerGroupFlowsRequest = z.infer<typeof ListWorkerGroupFlowsRequest>

export const WorkerGroupProjectAssignment = z.object({
    id: z.string(),
    displayName: z.string(),
    color: z.string(),
    workerGroupId: z.string().nullable(),
    maxConcurrentJobs: z.number().nullable(),
    defaultMaxConcurrentJobs: z.number(),
    flowCount: z.number(),
    flowsElsewhere: z.number(),
    pinnedFlows: z.array(z.object({
        workerGroupId: z.string(),
        count: z.number(),
    })),
})
export type WorkerGroupProjectAssignment = z.infer<typeof WorkerGroupProjectAssignment>

export const WorkerGroupFlowAssignment = z.object({
    id: z.string(),
    displayName: z.string(),
    projectId: z.string(),
    projectName: z.string(),
    projectColor: z.string(),
    enabled: z.boolean(),
    workerGroupId: z.string().nullable(),
    inherited: z.string().nullable(),
    effective: z.string().nullable(),
})
export type WorkerGroupFlowAssignment = z.infer<typeof WorkerGroupFlowAssignment>

export const WorkerGroupProjectAssignmentPage = z.object({
    data: z.array(WorkerGroupProjectAssignment),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    offset: z.number(),
    total: z.number(),
})
export type WorkerGroupProjectAssignmentPage = z.infer<typeof WorkerGroupProjectAssignmentPage>

export const WorkerGroupFlowAssignmentPage = z.object({
    data: z.array(WorkerGroupFlowAssignment),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    offset: z.number(),
    total: z.number(),
})
export type WorkerGroupFlowAssignmentPage = z.infer<typeof WorkerGroupFlowAssignmentPage>

export const AssignWorkerGroupProjectsRequest = z.object({
    projects: z.array(ApId).min(1).max(WORKER_GROUP_BULK_ASSIGN_MAX_ITEMS),
    workerGroupId: WorkerGroupLabel.nullable(),
})
export type AssignWorkerGroupProjectsRequest = z.infer<typeof AssignWorkerGroupProjectsRequest>

export const AssignWorkerGroupFlowsRequest = z.object({
    flows: z.array(ApId).min(1).max(WORKER_GROUP_BULK_ASSIGN_MAX_ITEMS),
    workerGroupId: WorkerGroupLabel.nullable(),
})
export type AssignWorkerGroupFlowsRequest = z.infer<typeof AssignWorkerGroupFlowsRequest>

export const MoveAllWorkerGroupRequest = z.object({
    from: WorkerGroupLabel,
    to: WorkerGroupLabel.nullable(),
    scope: z.enum([WorkerGroupScope.PROJECT, WorkerGroupScope.FLOW]),
})
export type MoveAllWorkerGroupRequest = z.infer<typeof MoveAllWorkerGroupRequest>

export const WorkerGroupMoveResult = z.object({
    movedWaitingRuns: z.number(),
    projects: z.array(z.string()),
    flows: z.array(z.string()),
})
export type WorkerGroupMoveResult = z.infer<typeof WorkerGroupMoveResult>
