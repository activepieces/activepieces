import { z } from 'zod'

export const AI_CREDITS_PER_DOLLAR = 1000

export const ReportAiCreditUsageRequest = z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    cost: z.number().nonnegative(),
})
export type ReportAiCreditUsageRequest = z.infer<typeof ReportAiCreditUsageRequest>

export const ProjectAiCreditUsage = z.object({
    projectId: z.string(),
    projectName: z.string(),
    credits: z.number(),
    creditsThisMonth: z.number(),
})
export type ProjectAiCreditUsage = z.infer<typeof ProjectAiCreditUsage>
