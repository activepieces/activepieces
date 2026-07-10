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
})

export const DiagnosticsWorker = z.object({
    workerId: z.string(),
    cpuCores: z.number(),
    cpuUsagePercentage: z.number(),
    ramUsagePercentage: z.number(),
    status: z.string(),
})

export const GetDiagnosticsResponse = z.object({
    database: InfraCheck,
    redis: InfraCheck,
    storage: InfraCheck,
    config: DeploymentConfig,
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
export type GetDiagnosticsResponse = z.infer<typeof GetDiagnosticsResponse>
