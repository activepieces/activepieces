import { apVersionUtil, systemUsage, UNKNOWN_VERSION } from '@activepieces/server-utils'
import { ActivepiecesError, ApEdition, apId, ErrorCode, FileLocation, GetDiagnosticsResponse, GetSystemHealthChecksResponse, InfraCheck, ReleaseHealth, tryCatch, unique } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { redisConnections } from '../database/redis-connections'
import { s3Helper } from '../file/s3-helper'
import { appMachineCache } from '../helper/app-machine-cache'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
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
    getDiagnostics: async (platformId: string): Promise<GetDiagnosticsResponse> => {
        // Self-hosted only: a platform admin here is the infra operator. On Cloud a platform admin is a
        // tenant, so exposing shared Redis/S3/DB latency + the internal S3 endpoint would leak operator
        // infra and let tenants probe storage they don't own.
        if (system.getEdition() === ApEdition.CLOUD) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message: 'Infra diagnostics are not available on the cloud edition' },
            })
        }
        const [database, redis, storage, machines, apps] = await Promise.all([
            measureDatabase(log),
            measureRedis(log),
            measureStorage(log),
            machineService(log).list(platformId),
            appMachineCache.list(),
        ])
        return {
            database,
            redis,
            storage,
            apps: {
                count: apps.length,
                instances: apps,
            },
            workers: {
                count: machines.length,
                machines: machines.map(worker => ({
                    workerId: worker.information.workerId,
                    cpuCores: worker.information.totalCpuCores,
                    cpuUsagePercentage: worker.information.cpuUsagePercentage,
                    ramUsagePercentage: worker.information.ramUsagePercentage,
                    serverPingMs: worker.information.serverPingMs ?? null,
                    cpuStealPercentage: worker.information.cpuStealPercentage,
                    cpuThrottledPercentage: worker.information.cpuThrottledPercentage,
                    status: worker.status,
                })),
            },
            config: {
                executionMode: system.get(AppSystemProp.EXECUTION_MODE) ?? null,
                fileStorageLocation: system.get(AppSystemProp.FILE_STORAGE_LOCATION) ?? null,
                sandboxMemoryLimitKb: system.getNumber(AppSystemProp.SANDBOX_MEMORY_LIMIT) ?? null,
                s3SignedUrls: system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS) ?? null,
                s3Endpoint: system.get(AppSystemProp.S3_ENDPOINT) ?? null,
                s3Region: system.get(AppSystemProp.S3_REGION) ?? null,
                projectRateLimiterEnabled: system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED) ?? null,
                defaultConcurrentJobsLimit: system.getNumber(AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) ?? null,
            },
        }
    },
})

async function measureDatabase(log: FastifyBaseLogger): Promise<InfraCheck> {
    const startedAt = Date.now()
    const { error } = await tryCatch(() => databaseConnection().query('SELECT 1'))
    if (error) {
        log.warn({ error }, '[diagnostics] database check failed')
        return { ok: false, latencyMs: null, detail: String(error) }
    }
    return { ok: true, latencyMs: Date.now() - startedAt }
}

async function measureRedis(log: FastifyBaseLogger): Promise<InfraCheck> {
    const startedAt = Date.now()
    const { error } = await tryCatch(async () => {
        const client = await redisConnections.useExisting()
        await client.ping()
    })
    if (error) {
        log.warn({ error }, '[diagnostics] redis check failed')
        return { ok: false, latencyMs: null, detail: String(error) }
    }
    return { ok: true, latencyMs: Date.now() - startedAt }
}

// Write + read a tiny object against the configured bucket to get the authoritative in-region S3
// round-trip. This is the worker/app->S3 latency a cross-region benchmark client cannot observe; the
// same cost is folded into every run's end-of-run log backup (part of the RUN phase).
async function measureStorage(log: FastifyBaseLogger): Promise<InfraCheck> {
    const location = system.get(AppSystemProp.FILE_STORAGE_LOCATION)
    if (location !== FileLocation.S3) {
        return { ok: true, latencyMs: null, detail: `FILE_STORAGE_LOCATION=${location ?? 'unset'} — no S3 round-trip to measure` }
    }
    const s3Key = `diagnostics/healthcheck-${apId()}.txt`
    const startedAt = Date.now()
    const { error } = await tryCatch(async () => {
        await s3Helper(log).uploadFile(s3Key, Buffer.from('activepieces-diagnostics'))
        await s3Helper(log).getFile(s3Key)
    })
    await tryCatch(() => s3Helper(log).deleteFiles([s3Key]))
    if (error) {
        log.warn({ error }, '[diagnostics] storage round-trip failed')
        return { ok: false, latencyMs: null, detail: String(error) }
    }
    return { ok: true, latencyMs: Date.now() - startedAt }
}

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
