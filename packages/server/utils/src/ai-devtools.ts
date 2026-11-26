import { tryCatch } from '@activepieces/core-utils'
import { registerTelemetry, Telemetry } from 'ai'

async function register({ enabled }: { enabled: boolean }): Promise<void> {
    if (!enabled) {
        return
    }
    const { data: devtools, error } = await tryCatch(() => import('@ai-sdk/devtools'))
    if (error) {
        return
    }
    registerTelemetry(devtools.DevToolsTelemetry() as Telemetry)
}

export const aiDevtools = {
    register,
}
