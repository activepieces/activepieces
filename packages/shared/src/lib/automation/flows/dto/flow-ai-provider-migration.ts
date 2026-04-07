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
    totalVersions: z.number(),
    processedVersions: z.number(),
    failedFlowVersions: z.array(z.object({
        flowVersionId: z.string(),
        flowId: z.string(),
        error: z.string(),
    })),
    sourceModel: AgentProviderModelSchema,
    targetModel: AgentProviderModelSchema,
    projectIds: z.array(z.string()).nullable().optional(),
})

export type FlowAiProviderMigration = z.infer<typeof FlowAiProviderMigration>
