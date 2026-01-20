import { systemUsage } from '@activepieces/server-shared'
import { GetSystemHealthChecksResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { system } from '../helper/system/system'
import { machineService } from '../workers/machine/machine-service'

let workerHealthStatus = false

export const healthStatusService = (log: FastifyBaseLogger) => ({
    markWorkerHealthy: async (): Promise<void> => {
        workerHealthStatus = true
    },
    checkDatabaseHealth: async (): Promise<boolean> => {
        try {
            const connection = databaseConnection()
            if (!connection.isInitialized) {
                return false
            }
            await connection.query('SELECT 1')
            return true
        } 
        catch (error) {
            log.warn({ error }, 'Database health check failed')
            return false
        }
    },
    isHealthy: async (): Promise<boolean> => {
        let workerHealthy = true
        let databaseHealthy = true

        if (system.isWorker()) {
            workerHealthy = workerHealthStatus
        }
        if (system.isApp()) {
            databaseHealthy = await healthStatusService(log).checkDatabaseHealth()
        }
        return  workerHealthy && databaseHealthy
    },
    getSystemHealthChecks: async (): Promise<GetSystemHealthChecksResponse> => {
        const workers = await machineService(log).list()
        const allWorkersPassedHealthcheck = workers.every(worker => worker.information.totalCpuCores > 1)
        const allWorkersHaveEnoughRam = workers.every(worker => worker.information.totalAvailableRamInBytes > gigaBytes(4))
        const databaseHealthy = await healthStatusService(log).checkDatabaseHealth()
        
        return {
            cpu: await systemUsage.getCpuCores() >= 1 && allWorkersPassedHealthcheck,
            disk: (await systemUsage.getDiskInfo()).total > gigaBytes(30),
            ram: (await systemUsage.getContainerMemoryUsage()).totalRamInBytes > gigaBytes(4) && allWorkersHaveEnoughRam,
            database: databaseHealthy,
        }
    },
})

const gigaBytes = (value: number) => value * 1024 * 1024 * 1024