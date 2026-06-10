import { z } from 'zod'

export * from './health-metrics-request'

export const GetSystemHealthChecksResponse = z.object({
    cpu: z.boolean(),
    disk: z.boolean(),
    ram: z.boolean(),
    database: z.boolean(),
})

export type GetSystemHealthChecksResponse = z.infer<typeof GetSystemHealthChecksResponse>
