import { ApId, BaseModelSchema } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events'

export enum AlertChannel {
    EMAIL = 'EMAIL',
}

export enum ExtraAlertEvents {
    ISSUE_CREATE = 'ISSUE_CREATE',
}

export const MergedEventNames = { ...ApplicationEventName, ...ExtraAlertEvents }

export const Alert = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    name: Type.String(),
    description: Type.String(),
    channel: Type.Enum(AlertChannel),
    receivers: Type.Array(Type.String()),
    events: Type.Array(Type.Enum(MergedEventNames)),
})

export type Alert = Static<typeof Alert>
export type AlertEvent = Alert['events'][number]