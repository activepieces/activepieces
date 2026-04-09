import { z } from 'zod'
import { BaseModelSchema } from '../../../core/common/base-model'
import { AgentProviderModelSchema } from './migrate-flow-model-request'

export enum FlowAiProviderMigrationStatus {
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export const FlowAiProviderMigration = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    userId: z.string(),
    status: z.nativeEnum(FlowAiProviderMigrationStatus),
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
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
    projectIds: z.array(z.string()).nullable().optional(),
})

export type FlowAiProviderMigration = z.infer<typeof FlowAiProviderMigration>
