import { Static, Type } from '@sinclair/typebox'
import { Cursor } from '../../../common/seek-page'
import { FlowId } from '../../flow'

export const ListTriggerEventsRequest = Type.Object({
    flowId: Type.String({}),
    limit: Type.Optional(Type.Number({})),
    projectId: Type.Optional(Type.String({})),
    cursor: Type.Optional(Type.String({})),
})

export type ListTriggerEventsRequest = Omit<Static<typeof ListTriggerEventsRequest>, 'flowId' | 'cursor'> & {
    flowId: FlowId
    projectId?: string
    cursor: Cursor | undefined
}

export const SaveTriggerEventRequest = Type.Object({
    flowId: Type.String({}),
    projectId: Type.String({}),
    mockData: Type.Unknown(),
})

export type SaveTriggerEventRequest = Static<typeof SaveTriggerEventRequest>