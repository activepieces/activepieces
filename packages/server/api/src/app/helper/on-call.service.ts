import { ActivepiecesError, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export const onCallService = (log: FastifyBaseLogger) => ({
    async page(error: ActivepiecesError): Promise<void> {
        const webhookUrl = system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)
        if (!webhookUrl) return
        const { error: fetchError } = await tryCatch(() =>
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: error.error.code, message: error.message, params: error.error.params }),
            }),
        )
        if (fetchError) {
            log.error({ fetchError }, 'Failed to send on-call page')
        }
    },
})
