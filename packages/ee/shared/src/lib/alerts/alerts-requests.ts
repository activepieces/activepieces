import { ApId } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { AlertChannel } from './alerts-dto'

export const ListAlertsParams = Type.Object({
    projectId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})
export type ListAlertsParams = Static<typeof ListAlertsParams>

export const CreateAlertParams = Type.Object({
    projectId: ApId,
    channel: Type.Enum(AlertChannel),
    receiver: Type.String({}),
})

export type CreateAlertParams = Static<typeof CreateAlertParams>