import { z } from 'zod'
import { BaseModelSchema } from '../../../core/common/base-model'
import { AIProviderModelType } from '../../../management/ai-providers'
import { AgentProviderModelSchema } from './migrate-flow-model-request'

export enum FlowMigrationStatus {
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum FlowMigrationType {
    AI_PROVIDER_MODEL = 'AI_PROVIDER_MODEL',
}

const PieceVersionChange = z.object({
    from: z.string(),
    to: z.string(),
})

const MigratedVersionEntry = z.object({
    flowVersionId: z.string(),
    flowId: z.string(),
    projectId: z.string(),
    draft: z.boolean(),
    newFlowVersionId: z.string().optional(),
    pieceVersionChanges: z.array(PieceVersionChange).optional(),
    changedFields: z.object({
        clearedAdvancedOptions: z.boolean().optional(),
        disabledWebSearch: z.boolean().optional(),
    }).optional(),
})

const FailedFlowVersionEntry = z.object({
    flowVersionId: z.string(),
    flowId: z.string(),
    projectId: z.string(),
    error: z.string(),
    draft: z.boolean(),
})

export const FlowMigrationFlowSummary = z.object({
    flowId: z.string(),
    displayName: z.string(),
    projectId: z.string(),
    projectName: z.string(),
})
export type FlowMigrationFlowSummary = z.infer<typeof FlowMigrationFlowSummary>

const FlowMigrationBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    userId: z.string(),
    status: z.nativeEnum(FlowMigrationStatus),
    migratedVersions: z.array(MigratedVersionEntry),
    failedFlowVersions: z.array(FailedFlowVersionEntry),
}

export const AiProviderModelMigrationData = z.object({
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
    aiProviderModelType: z.enum(AIProviderModelType),
    dryCheck: z.boolean(),
    projectIds: z.array(z.string()),
})

export const FlowMigration = z.discriminatedUnion('type', [
    z.object({
        ...FlowMigrationBase,
        type: z.literal(FlowMigrationType.AI_PROVIDER_MODEL),
        params: AiProviderModelMigrationData,
    }),
])

export type AiProviderModelMigrationData = z.infer<typeof AiProviderModelMigrationData>
export type MigratedVersionEntry = z.infer<typeof MigratedVersionEntry>
export type PieceVersionChange = z.infer<typeof PieceVersionChange>
export type FailedFlowVersionEntry = z.infer<typeof FailedFlowVersionEntry>
export type FlowMigration = z.infer<typeof FlowMigration>
