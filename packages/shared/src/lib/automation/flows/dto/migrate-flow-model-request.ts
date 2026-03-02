import { Static, Type } from '@sinclair/typebox'
import { AIProviderName } from '../../../management/ai-providers'

export const AgentProviderModelSchema = Type.Object({
    provider: Type.Enum(AIProviderName),
    model: Type.String(),
})
export type AgentProviderModelSchema = Static<typeof AgentProviderModelSchema>

export const MigrateFlowsModelRequest = Type.Object({
    projectIds: Type.Optional(Type.Array(Type.String())),
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
})
export type MigrateFlowsModelRequest = Static<typeof MigrateFlowsModelRequest>

export const MigrateFlowsModelResponse = Type.Object({
    updatedFlows: Type.Number(),
})
export type MigrateFlowsModelResponse = Static<typeof MigrateFlowsModelResponse>
