import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { WorkerSettingsResponse } from '@activepieces/shared'

let settings: WorkerSettingsResponse | undefined
let settingsResolver: (() => void) | null = null
const settingsReady = new Promise<void>((resolve) => {
    settingsResolver = resolve
})

export const workerSettings = {
    set(response: WorkerSettingsResponse): void {
        settings = response
        settingsResolver?.()
    },

    getSettings(): WorkerSettingsResponse {
        assertNotNullOrUndefined(settings, 'Worker settings are not initialized. Settings are fetched on socket connect.')
        return settings
    },

    waitForSettings(): Promise<WorkerSettingsResponse> {
        return settingsReady.then(() => settings!)
    },

    flowTimeoutMs(): number {
        return (settings?.FLOW_TIMEOUT_SECONDS ?? FALLBACK_FLOW_TIMEOUT_SECONDS) * 1000
    },

    longRunningTimeoutMs(): number {
        return workerSettings.flowTimeoutMs() + LONG_RUNNING_MARGIN_MS
    },
}

const LONG_RUNNING_MARGIN_MS = 120_000
const FALLBACK_FLOW_TIMEOUT_SECONDS = 600
