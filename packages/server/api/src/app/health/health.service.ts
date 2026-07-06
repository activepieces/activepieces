import { apVersionUtil, systemUsage } from '@activepieces/server-utils'
import { GetSystemHealthChecksResponse, ReleaseHealth, unique } from '@activepieces/shared'
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
    getSystemHealthChecks: async (platformId: string): Promise<GetSystemHealthChecksResponse> => {
        const workers = await machineService(log).list(platformId)
        const allWorkersPassedHealthcheck = workers.every(worker => worker.information.totalCpuCores >= 1)
        const allWorkersHaveEnoughRam = workers.every(worker => worker.information.totalAvailableRamInBytes >= gigaBytes(4))
        const databaseHealthy = await healthStatusService(log).checkDatabaseHealth()
        const release = buildReleaseHealth(log, workers.map(worker => worker.information.workerProps.version))

        return {
            cpu: await systemUsage.getCpuCores() >= 1 && allWorkersPassedHealthcheck,
            disk: (await systemUsage.getDiskInfo()).total >= gigaBytes(30),
            ram: (await systemUsage.getContainerMemoryUsage()).totalRamInBytes >= gigaBytes(4) && allWorkersHaveEnoughRam,
            database: databaseHealthy,
            release,
        }
    },
})

// Surfaces the exact "workers connected but idle" state behind version-skew: workers whose
// release does not match the app's are silently withheld jobs by the dispatch gate
// (worker-rpc-service.ts). readOk === false means the app itself failed to read its release
// ('0.0.0'), which fail-closes the gate for every worker.
function buildReleaseHealth(log: FastifyBaseLogger, workerVersions: Array<string | undefined>): ReleaseHealth {
    const { version: current, readOk } = apVersionUtil.getReleaseInfo()
    const mismatched = workerVersions
        .filter(workerVersion => !apVersionUtil.versionsAreCompatible({ versionA: workerVersion, versionB: current }))
        .map(workerVersion => workerVersion ?? UNKNOWN_WORKER_VERSION)
    const mismatchedVersions = unique(mismatched)
    if (!readOk || mismatched.length > 0) {
        log.warn({ release: { version: current }, worker: { readOk, mismatchedVersions } }, '[health] Release integrity check failed — worker dispatch is gated for skewed or unreadable versions')
    }
    return {
        current,
        readOk,
        workers: {
            total: workerVersions.length,
            versionMismatched: mismatched.length,
            mismatchedVersions,
        },
    }
}

const gigaBytes = (value: number) => value * 1024 * 1024 * 1024

const UNKNOWN_WORKER_VERSION = 'unknown'
