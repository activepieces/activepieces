import { z } from 'zod'

export * from './health-metrics-request'

export const ReleaseHealth = z.object({
    current: z.string(),
    workers: z.object({
        total: z.number(),
        versionMismatched: z.number(),
        mismatchedVersions: z.array(z.string()),
    }),
})

export const GetSystemHealthChecksResponse = z.object({
    latestVersion: z.string(),
    appCpu: z.boolean(),
    appRam: z.boolean(),
    disk: z.boolean(),
    workerCpu: z.boolean().nullable(),
    workerRam: z.boolean().nullable(),
    database: z.boolean(),
    release: ReleaseHealth,
})

// Server-measured infra round-trip, so a cross-region benchmark client gets the authoritative
// in-region latency that its own client-side timing cannot observe.
export const InfraCheck = z.object({
    ok: z.boolean(),
    latencyMs: z.number().nullable(),
    detail: z.string().optional(),
})

export const DeploymentConfig = z.object({
    executionMode: z.string().nullable(),
    fileStorageLocation: z.string().nullable(),
    sandboxMemoryLimitKb: z.number().nullable(),
    s3SignedUrls: z.boolean().nullable(),
    s3Endpoint: z.string().nullable(),
    s3Region: z.string().nullable(),
    projectRateLimiterEnabled: z.boolean().nullable(),
    defaultConcurrentJobsLimit: z.number().nullable(),
})

export const DiagnosticsWorker = z.object({
    workerId: z.string(),
    cpuCores: z.number(),
    cpuUsagePercentage: z.number(),
    ramUsagePercentage: z.number(),
    // Worker→app round-trip (ms) — the callback path that inflates a run's RUN phase. null on older workers.
    serverPingMs: z.number().nullable(),
    // CPU pressure invisible to usage%: hypervisor steal (noisy neighbors on shared-CPU nodes,
    // e.g. GCE E2 — /proc/stat is node-wide) and CFS throttling against the container's own CPU
    // limit (~100ms stalls per throttled period). Absent on older machines / non-Linux.
    cpuStealPercentage: z.number().optional(),
    cpuThrottledPercentage: z.number().optional(),
    status: z.string(),
})

// One live app replica, self-registered into the appMachines cache on its metrics tick. Unlike a
// worker (which registers over its healthcheck socket), an app has no inbound connection, so it
// writes its own row; `updated` drives offline detection since an app dies without a disconnect.
export const AppInstance = z.object({
    hostname: z.string(),
    version: z.string(),
    cpuCores: z.number(),
    cpuUsagePercentage: z.number(),
    ramTotalBytes: z.number(),
    ramUsagePercentage: z.number(),
    diskPercentage: z.number(),
    eventLoopDelayMs: z.number(),
    // Same pressure signals as DiagnosticsWorker — steal detects shared-CPU neighbor contention.
    cpuStealPercentage: z.number().optional(),
    cpuThrottledPercentage: z.number().optional(),
    updated: z.string(),
})

export const GetDiagnosticsResponse = z.object({
    database: InfraCheck,
    redis: InfraCheck,
    storage: InfraCheck,
    config: DeploymentConfig,
    apps: z.object({
        count: z.number(),
        instances: z.array(AppInstance),
    }),
    workers: z.object({
        count: z.number(),
        machines: z.array(DiagnosticsWorker),
    }),
})

export type ReleaseHealth = z.infer<typeof ReleaseHealth>
export type GetSystemHealthChecksResponse = z.infer<typeof GetSystemHealthChecksResponse>
export type InfraCheck = z.infer<typeof InfraCheck>
export type DeploymentConfig = z.infer<typeof DeploymentConfig>
export type DiagnosticsWorker = z.infer<typeof DiagnosticsWorker>
export type AppInstance = z.infer<typeof AppInstance>
export type GetDiagnosticsResponse = z.infer<typeof GetDiagnosticsResponse>
