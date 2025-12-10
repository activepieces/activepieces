import { getContainerMemoryUsage, getCpuCores, getDiskInfo } from '@activepieces/server-shared'
import { GetSystemHealthChecksResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { workerMachineCache } from '../workers/machine/machine-cache'

let workerHealthStatus = false

export const healthStatusService = (_log: FastifyBaseLogger) => ({
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
        const workers = await workerMachineCache().find()
        const allWorkersPassedHealthcheck = workers.every(worker => worker.information.totalCpuCores > 1)
        const allWorkersHaveEnoughRam = workers.every(worker => worker.information.totalAvailableRamInBytes > gigaBytes(4))
        
        return {
            cpu: await getCpuCores() >= 1 && allWorkersPassedHealthcheck,
            disk: (await getDiskInfo()).total > gigaBytes(30),
            ram: (await getContainerMemoryUsage()).totalRamInBytes > gigaBytes(4) && allWorkersHaveEnoughRam,
        }
    },
})

const gigaBytes = (value: number) => value * 1024 * 1024 * 1024