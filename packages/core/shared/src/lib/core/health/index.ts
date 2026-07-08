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

export type ReleaseHealth = z.infer<typeof ReleaseHealth>
export type GetSystemHealthChecksResponse = z.infer<typeof GetSystemHealthChecksResponse>
