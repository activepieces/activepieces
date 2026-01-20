import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../../../common/id-generator'
import { Cursor } from '../../../common/seek-page'
import { FlowId } from '../../flow'

export const ListTriggerEventsRequest = Type.Object({
    projectId: ApId,
    flowId: Type.String({}),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
})

export type ListTriggerEventsRequest = Omit<Static<typeof ListTriggerEventsRequest>, 'flowId' | 'cursor'> & {
    flowId: FlowId
    cursor: Cursor | undefined
}

export const SaveTriggerEventRequest = Type.Object({
    projectId: ApId,
    flowId: Type.String({}),
    mockData: Type.Unknown(),
})

export type SaveTriggerEventRequest = Static<typeof SaveTriggerEventRequest>