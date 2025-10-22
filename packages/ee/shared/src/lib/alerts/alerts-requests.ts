import { ApId } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { Alert } from './alerts-dto'

export const ListAlertsParams = Type.Object({
    projectId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})
export type ListAlertsParams = Static<typeof ListAlertsParams>

export const CreateAlertParams = Type.Omit(Alert, ['created', 'updated', 'id', 'projectId'])

export type CreateAlertParams = Static<typeof CreateAlertParams>

export const UpdateAlertParams = Type.Partial(Type.Omit(CreateAlertParams, ['channel']))

export type UpdateAlertParams = Static<typeof UpdateAlertParams>