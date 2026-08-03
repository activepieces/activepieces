import { FlowRunStatus } from '@activepieces/core-execution'
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
    serverPingMs: z.number().nullable(),
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
    cpuStealPercentage: z.number().optional(),
    cpuThrottledPercentage: z.number().optional(),
    updated: z.string(),
})

// A recent failed production run with its cause, read straight off the flow_run row
// (failedStep carries the failing step name + truncated error message) — so a benchmark
// or support triage gets the "why" without fetching each run's log file.
export const DiagnosticsRecentFailure = z.object({
    runId: z.string(),
    projectId: z.string(),
    flowId: z.string(),
    status: z.enum(FlowRunStatus),
    failedStepName: z.string().nullable(),
    errorMessage: z.string().nullable(),
    created: z.string(),
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
    recentFailures: z.object({
        lookbackHours: z.number(),
        total: z.number(),
        samples: z.array(DiagnosticsRecentFailure),
    }).optional(),
})

// The failure scan is opt-in: diagnostics is polled every few seconds by benchmark samplers,
// and the scan's queries would both load the DB mid-benchmark and skew the measured db latency.
export const GetDiagnosticsQuery = z.object({
    recentFailures: z.enum(['true', 'false']).optional(),
})

export type ReleaseHealth = z.infer<typeof ReleaseHealth>
export type GetSystemHealthChecksResponse = z.infer<typeof GetSystemHealthChecksResponse>
export type InfraCheck = z.infer<typeof InfraCheck>
export type DeploymentConfig = z.infer<typeof DeploymentConfig>
export type DiagnosticsWorker = z.infer<typeof DiagnosticsWorker>
export type DiagnosticsRecentFailure = z.infer<typeof DiagnosticsRecentFailure>
export type GetDiagnosticsQuery = z.infer<typeof GetDiagnosticsQuery>
export type AppInstance = z.infer<typeof AppInstance>
export type GetDiagnosticsResponse = z.infer<typeof GetDiagnosticsResponse>
