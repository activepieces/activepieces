import { Static, Type } from '@sinclair/typebox'
import { BaseModel } from '../../common/base-model'

export type TriggerEventId = string

export const TriggerEvent = Type.Object({
    id: Type.String(),
    projectId: Type.String(),
    flowId: Type.String(),
    sourceName: Type.String(),
    fileId: Type.String(),
})
export type TriggerEvent = Static<typeof TriggerEvent> & BaseModel<TriggerEventId>


export const TriggerEventWithPayload = Type.Composite([
    TriggerEvent,
    Type.Object({
        payload: Type.Unknown(),
    }),
])

export type TriggerEventWithPayload = Static<typeof TriggerEventWithPayload>