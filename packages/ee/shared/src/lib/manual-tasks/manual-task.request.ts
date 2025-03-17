import { Static, Type } from "@sinclair/typebox"
import { ApId } from "@activepieces/shared"
import { StatusOption } from "."

const StatusOptionsSchema = Type.Array(StatusOption, { minItems: 1 })

export const ListManualTasksQueryParams = Type.Object({
    platformId: ApId,
    projectId: ApId,
    flowId: Type.Optional(ApId),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    assigneeId: Type.Optional(ApId),
    statusOptions: Type.Optional(Type.Array(Type.String())),
    title: Type.Optional(Type.String()),
})
export type ListManualTasksQueryParams = Static<typeof ListManualTasksQueryParams>

export const UpdateManualTaskRequestBody = Type.Object({
    title: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    status: Type.Optional(StatusOption),
    statusOptions: Type.Optional(StatusOptionsSchema),
    assigneeId: Type.Optional(ApId),
})
export type UpdateManualTaskRequestBody = Static<typeof UpdateManualTaskRequestBody>


export const CreateManualTaskRequestBody = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    statusOptions: StatusOptionsSchema,
    flowId: ApId,
    runId: ApId,
    assigneeId: Type.Optional(ApId),
})
export type CreateManualTaskRequestBody = Static<typeof CreateManualTaskRequestBody>
