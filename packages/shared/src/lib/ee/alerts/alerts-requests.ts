import { z } from 'zod'
import { ApId } from '../../core/common/id-generator'
import { AlertChannel } from './alerts-dto'

export const ListAlertsParams = z.object({
    projectId: ApId,
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
})
export type ListAlertsParams = z.infer<typeof ListAlertsParams>

export const CreateAlertParams = z.object({
    projectId: ApId,
    channel: z.nativeEnum(AlertChannel),
    receiver: z.string(),
})

export type CreateAlertParams = z.infer<typeof CreateAlertParams>
