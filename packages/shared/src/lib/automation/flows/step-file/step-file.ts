import { z } from 'zod'
import { ApMultipartFile } from '../../../core/common'

export const StepFileUpsertRequest = z.object({
    flowId: z.string(),
    stepName: z.string(),
    file: ApMultipartFile.pick({ data: true }).optional(),
    contentLength: z.number(),
    fileName: z.string(),
})

export type StepFileUpsert = z.infer<typeof StepFileUpsertRequest>

export const StepFileUpsertResponse = z.object({
    uploadUrl: z.string().optional(),
    url: z.string(),
})

export type StepFileUpsertResponse = z.infer<typeof StepFileUpsertResponse>
