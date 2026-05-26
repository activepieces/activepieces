import { z } from 'zod'
import { ApId } from '../../core/common/id-generator'

export const WebhookUrlParams = z.object({
    flowId: ApId,
})

export type WebhookUrlParams = z.infer<typeof WebhookUrlParams>
