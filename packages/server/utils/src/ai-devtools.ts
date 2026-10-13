import { registerTelemetry } from 'ai'

async function register({ enabled }: { enabled: boolean }): Promise<void> {
    if (!enabled) {
        return
    }
    const { DevToolsTelemetry } = await import('@ai-sdk/devtools')
    registerTelemetry(DevToolsTelemetry())
}

export const aiDevtools = {
    register,
}
