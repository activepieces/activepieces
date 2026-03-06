import { assertNotNullOrUndefined, WorkerSettingsResponse } from '@activepieces/shared'
import { apiClient } from '../api/api-client'
import { logger } from './logger'

let settings: WorkerSettingsResponse | undefined

export const workerSettings = {
    async init(apiUrl: string, workerToken: string): Promise<void> {
        logger.info('Fetching worker settings from API...')
        settings = await apiClient.getWorkerSettings(apiUrl, workerToken)
        logger.info({ environment: settings.ENVIRONMENT, executionMode: settings.EXECUTION_MODE }, 'Worker settings loaded')
    },

    getSettings(): WorkerSettingsResponse {
        assertNotNullOrUndefined(settings, 'Worker settings are not initialized. Call workerSettings.init() first.')
        return settings
    },
}
