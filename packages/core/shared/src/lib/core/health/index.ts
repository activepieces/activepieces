import { z } from 'zod'

export * from './health-metrics-request'

export const GetSystemHealthChecksResponse = z.object({
    latestVersion: z.string(),
    appCpu: z.boolean(),
    appRam: z.boolean(),
    disk: z.boolean(),
    workerCpu: z.boolean().nullable(),
    workerRam: z.boolean().nullable(),
    database: z.boolean(),
})

export type GetSystemHealthChecksResponse = z.infer<typeof GetSystemHealthChecksResponse>
