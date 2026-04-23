import { z } from 'zod'
import { formErrors } from '../../../form-errors'
import { AIProviderModelType, AIProviderName } from '../../../management/ai-providers'

export const AgentProviderModelSchema = z.object({
    provider: z.enum(AIProviderName),
    model: z.string().min(1),
})
export type AgentProviderModelSchema = z.infer<typeof AgentProviderModelSchema>

export const MigrateFlowsModelRequest = z.object({
    projectIds: z.array(z.string()).min(1, formErrors.required),
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
    aiProviderModelType: z.enum(AIProviderModelType),
    dryCheck: z.boolean(),
})
export type MigrateFlowsModelRequest = z.infer<typeof MigrateFlowsModelRequest>
