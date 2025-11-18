import { system } from '../helper/system/system'

let workerHealthStatus = false

export const healthStatusService = {
    markWorkerHealthy: async (): Promise<void> => {
        workerHealthStatus = true
    },
    isHealthy: (): boolean => {
        if (system.isWorker()) {
            return workerHealthStatus
        }
        return true
    },
}