import { ActivepiecesError, tryCatch } from '@activepieces/shared'

export const onCallService = (log: OnCallLogger, webhookUrl: string | undefined) => ({
    async page(error: string): Promise<void> {
        if (!webhookUrl) return
        const { error: fetchError } = await tryCatch(() =>
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: error,
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
