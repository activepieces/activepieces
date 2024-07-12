import { extractPayloads } from './extract-trigger-payload-hooks'
import { tryHandshake } from './handshake-trigger.hook'
import { renewWebhook } from './renew-trigger-hook'

export const triggerConsumer = {
    renewWebhook,
    extractPayloads,
    tryHandshake,
}