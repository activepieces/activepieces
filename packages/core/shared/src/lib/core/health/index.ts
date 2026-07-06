import { z } from 'zod'

export * from './health-metrics-request'

export const ReleaseHealth = z.object({
    current: z.string(),
    readOk: z.boolean(),
    workers: z.object({
        total: z.number(),
        versionMismatched: z.number(),
        mismatchedVersions: z.array(z.string()),
    }),
})

export const GetSystemHealthChecksResponse = z.object({
    cpu: z.boolean(),
    disk: z.boolean(),
    ram: z.boolean(),
    database: z.boolean(),
    release: ReleaseHealth,
})

export type ReleaseHealth = z.infer<typeof ReleaseHealth>
export type GetSystemHealthChecksResponse = z.infer<typeof GetSystemHealthChecksResponse>
