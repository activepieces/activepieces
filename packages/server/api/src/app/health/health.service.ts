import { getContainerMemoryUsage, getCpuCores, getDiskInfo } from '@activepieces/server-shared'
import { GetSystemHealthChecksResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'

let workerHealthStatus = false

export const healthStatusService = (log: FastifyBaseLogger) => ({
    markWorkerHealthy: async (): Promise<void> => {
        workerHealthStatus = true
    },
    isHealthy: (): boolean => {
        if (system.isWorker()) {
            return workerHealthStatus
        }
        return true
    },
    getSystemHealthChecks: async (): Promise<GetSystemHealthChecksResponse> => {
        return {
            cpu: await getCpuCores() >= 1,
            disk: (await getDiskInfo()).total > gigaBytes(30),
            ram: (await getContainerMemoryUsage()).totalRamInBytes > gigaBytes(4),
        }
    },
})

const gigaBytes = (value: number) => value * 1024 * 1024 * 1024