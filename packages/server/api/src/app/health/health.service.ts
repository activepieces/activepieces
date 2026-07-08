import { apVersionUtil, systemUsage, UNKNOWN_VERSION } from '@activepieces/server-utils'
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
        const [workers, databaseHealthy, latestVersion] = await Promise.all([
            machineService(log).list(platformId),
            healthStatusService(log).checkDatabaseHealth(),
            apVersionUtil.getLatestRelease(),
        ])
        const hasWorkers = workers.length > 0
        const release = buildReleaseHealth(log, workers.map(worker => worker.information.workerProps.version))

        return {
            latestVersion,
            appCpu: await systemUsage.getCpuCores() >= APP_MIN_CPU_CORES,
            appRam: (await systemUsage.getContainerMemoryUsage()).totalRamInBytes >= gigaBytes(APP_MIN_RAM_GB),
            disk: (await systemUsage.getDiskInfo()).total >= gigaBytes(APP_MIN_DISK_GB),
            workerCpu: hasWorkers ? workers.every(worker => worker.information.totalCpuCores >= WORKER_MIN_CPU_CORES) : null,
            workerRam: hasWorkers ? workers.every(worker => worker.information.totalAvailableRamInBytes >= gigaBytes(WORKER_MIN_RAM_GB)) : null,
            database: databaseHealthy,
            release,
        }
    },
})

// Surfaces the exact "workers connected but idle" state behind version-skew: workers whose
// release does not match the app's are silently withheld jobs by the dispatch gate
// (worker-rpc-service.ts). A `current` of UNKNOWN_VERSION ('0.0.0') means the app itself failed
// to read its release, which fail-closes the gate for every worker.
function buildReleaseHealth(log: FastifyBaseLogger, workerVersions: Array<string | undefined>): ReleaseHealth {
    const current = apVersionUtil.getCurrentRelease()
    const mismatched = workerVersions
        .filter(workerVersion => !apVersionUtil.versionsAreCompatible({ versionA: workerVersion, versionB: current }))
        .map(workerVersion => workerVersion ?? UNKNOWN_WORKER_VERSION)
    const mismatchedVersions = unique(mismatched)
    if (current === UNKNOWN_VERSION || mismatched.length > 0) {
        log.warn({ release: { version: current }, worker: { mismatchedVersions } }, '[health] Release integrity check failed — worker dispatch is gated for skewed or unreadable versions')
    }
    return {
        current,
        workers: {
            total: workerVersions.length,
            versionMismatched: mismatched.length,
            mismatchedVersions,
        },
    }
}

const gigaBytes = (value: number) => value * 1024 * 1024 * 1024

const APP_MIN_CPU_CORES = 1
const APP_MIN_RAM_GB = 2
const APP_MIN_DISK_GB = 30
const WORKER_MIN_CPU_CORES = 0.5
const WORKER_MIN_RAM_GB = 1

const UNKNOWN_WORKER_VERSION = 'unknown'
