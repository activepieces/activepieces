import { z } from 'zod'
import { AIProviderName } from '../../../management/ai-providers'

export const AgentProviderModelSchema = z.object({
    provider: z.enum(AIProviderName),
    model: z.string().min(1),
})
export type AgentProviderModelSchema = z.infer<typeof AgentProviderModelSchema>

export const MigrateFlowsModelRequest = z.object({
    projectIds: z.array(z.string()).optional(),
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
})
export type MigrateFlowsModelRequest = z.infer<typeof MigrateFlowsModelRequest>
