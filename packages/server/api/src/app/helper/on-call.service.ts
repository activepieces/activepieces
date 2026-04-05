import { ErrorCode, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export const onCallService = (log: FastifyBaseLogger) => ({
    async page(code: ErrorCode): Promise<void> {
        const webhookUrl = system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)
        if (!webhookUrl) return
        const { error } = await tryCatch(() =>
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, message: code }),
            }),
        )
        if (error) {
            log.error({ error }, 'Failed to send on-call page')
        }
    },
})
