import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema, Nullable } from "../../common";


export enum TriggerRunStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TIMED_OUT = 'TIMED_OUT',
}

export const TriggerRun = Type.Object({
    ...BaseModelSchema,
    platformId: Type.String(),
    payloadFileId: Type.String(),
    error: Nullable(Type.String()),
    projectId: Type.String(),
    status: Type.Enum(TriggerRunStatus),
    triggerSourceId: Type.String(),
})

export type TriggerRun = Static<typeof TriggerRun>


export const CreateTriggerRunRequestBody = Type.Object({
    status: Type.Enum(TriggerRunStatus),
    payload: Type.Unknown(),
    error: Nullable(Type.String()),
    flowId: Type.String(),
    simulate: Type.Boolean(),
})

export type CreateTriggerRunRequestBody = Static<typeof CreateTriggerRunRequestBody>