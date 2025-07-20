import { extractPayloads } from './extract-trigger-payload-hooks'
import { renewWebhook } from './renew-trigger-hook'

export const triggerConsumer = {
    renewWebhook,
    extractPayloads,
}