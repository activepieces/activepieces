import { tryCatch } from '@activepieces/shared'

export const onCallService = (log: OnCallLogger, webhookUrl: string | undefined) => ({
    async page(error: OnCallPagePayload): Promise<void> {
        if (!webhookUrl) return
        const { error: fetchError } = await tryCatch(() =>
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: error.code, message: error.message, params: error.params }),
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
