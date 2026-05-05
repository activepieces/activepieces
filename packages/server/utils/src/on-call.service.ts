import { tryCatch } from '@activepieces/shared'
import { safeHttp } from './safe-http'

export const onCallService = (log: OnCallLogger, webhookUrl: string | undefined) => ({
    async page(error: OnCallPagePayload): Promise<void> {
        if (!webhookUrl) return
        const { error: fetchError } = await tryCatch(() =>
            safeHttp.axios.request({
                url: webhookUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { code: error.code, message: error.message, params: error.params },
                validateStatus: () => true,
            }),
        )
        if (fetchError) {
            log.error({ fetchError }, 'Failed to send on-call page')
        }
    },
})

type OnCallLogger = {
    error: (obj: Record<string, unknown>, msg: string) => void
}

export type OnCallPagePayload = {
    code: string
    message: string
    params?: Record<string, unknown>
}
