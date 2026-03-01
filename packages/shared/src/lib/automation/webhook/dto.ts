import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../../core/common/id-generator'

export const WebhookUrlParams = Type.Object({
    flowId: ApId,
})

export type WebhookUrlParams = Static<typeof WebhookUrlParams>
