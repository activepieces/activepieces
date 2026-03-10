import { z } from 'zod'
import { OptionalArrayFromQuery, OptionalBooleanFromQuery } from '../../../core/common/base-model'
import { ApId } from '../../../core/common/id-generator'
import { FlowRunStatus } from '../execution/flow-execution'

export const ListFlowRunsRequestQuery = z.object({
    flowId: OptionalArrayFromQuery(ApId),
    tags: OptionalArrayFromQuery(z.string()),
    status: OptionalArrayFromQuery(z.nativeEnum(FlowRunStatus)),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
    projectId: ApId,
    failedStepName: z.string().optional(),
    flowRunIds: OptionalArrayFromQuery(ApId),
    includeArchived: OptionalBooleanFromQuery,
})

export type ListFlowRunsRequestQuery = z.infer<typeof ListFlowRunsRequestQuery>
