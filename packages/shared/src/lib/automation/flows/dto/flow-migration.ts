import { z } from 'zod'
import { BaseModelSchema } from '../../../core/common/base-model'
import { AgentProviderModelSchema } from './migrate-flow-model-request'

export enum FlowMigrationStatus {
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum FlowMigrationType {
    AI_PROVIDER_MODEL = 'AI_PROVIDER_MODEL',
}

const FlowMigrationBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    userId: z.string(),
    status: z.nativeEnum(FlowMigrationStatus),
    migratedVersions: z.array(z.object({
        flowVersionId: z.string(),
        flowId: z.string(),
        draft: z.boolean(),
    })),
    failedFlowVersions: z.array(z.object({
        flowVersionId: z.string(),
        flowId: z.string(),
        error: z.string(),
        draft: z.boolean(),
    })),
}

export const AiProviderModelMigrationData = z.object({
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
    projectIds: z.array(z.string()).nullable().optional(),
})

export const FlowMigration = z.discriminatedUnion('type', [
    z.object({
        ...FlowMigrationBase,
        type: z.literal(FlowMigrationType.AI_PROVIDER_MODEL),
        params: AiProviderModelMigrationData,
    }),
])

export type AiProviderModelMigrationData = z.infer<typeof AiProviderModelMigrationData>
export type FlowMigration = z.infer<typeof FlowMigration>
