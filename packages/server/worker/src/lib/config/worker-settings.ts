import { assertNotNullOrUndefined, WorkerSettingsResponse } from '@activepieces/shared'

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
}
