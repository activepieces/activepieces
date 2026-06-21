import { ApId } from '@activepieces/core-utils'
import { z } from 'zod'

export const WebhookUrlParams = z.object({
    flowId: ApId,
})

export type WebhookUrlParams = z.infer<typeof WebhookUrlParams>
