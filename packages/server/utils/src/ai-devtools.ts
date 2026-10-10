import { isObject } from '@activepieces/core-utils'
import { registerTelemetry, Telemetry } from 'ai'

async function register({ enabled }: { enabled: boolean }): Promise<void> {
    if (!enabled) {
        return
    }
    const { DevToolsTelemetry } = await import('@ai-sdk/devtools')
    const integration: unknown = DevToolsTelemetry()
    if (!isTelemetry(integration)) {
        return
    }
    registerTelemetry(integration)
}

function isTelemetry(value: unknown): value is Telemetry {
    return isObject(value)
}

export const aiDevtools = {
    register,
}
