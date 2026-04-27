import { z } from 'zod'
import { formErrors } from '../../../form-errors'
import { AIProviderModelType, AIProviderName } from '../../../management/ai-providers'

export const AgentProviderModelSchema = z.object({
    provider: z.enum(AIProviderName),
    model: z.string().min(1),
})
export type AgentProviderModelSchema = z.infer<typeof AgentProviderModelSchema>

export const AiProviderModelMigrationRequest = z.object({
    type: z.literal('AI_PROVIDER_MODEL'),
    projectIds: z.array(z.string()).min(1, formErrors.required),
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
    aiProviderModelType: z.enum(AIProviderModelType),
    dryCheck: z.boolean(),
})
export type AiProviderModelMigrationRequest = z.infer<typeof AiProviderModelMigrationRequest>

export const AiProviderModelRevertMigrationRequest = z.object({
    type: z.literal('AI_PROVIDER_MODEL_REVERT'),
    revertOfMigrationId: z.string(),
})
export type AiProviderModelRevertMigrationRequest = z.infer<typeof AiProviderModelRevertMigrationRequest>

export const MigrateFlowsModelRequest = z.discriminatedUnion('type', [
    AiProviderModelMigrationRequest,
    AiProviderModelRevertMigrationRequest,
])
export type MigrateFlowsModelRequest = z.infer<typeof MigrateFlowsModelRequest>
