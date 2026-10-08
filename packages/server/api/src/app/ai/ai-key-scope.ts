import { isNil } from '@activepieces/core-utils'
import { AiProviderModelScope } from '@activepieces/shared'
import { z } from 'zod'
import { AIProviderSchema } from './ai-provider-entity'

export const aiKeyScope = {
    rowAllowsScope({ row, scope }: { row: Pick<AIProviderSchema, 'projectScope' | 'projectIds'>, scope: ProviderScope }): boolean {
        if (scope.type === 'platform') {
            return true
        }
        switch (row.projectScope) {
            case 'selected':
                return row.projectIds.includes(scope.projectId)
            case 'except':
                return !row.projectIds.includes(scope.projectId)
            default:
                return true
        }
    },
    scopeAllows({ modelScope, modelIds, modelId }: { modelScope: AiProviderModelScope, modelIds: string[], modelId: string }): boolean {
        return modelScope !== 'selected' || modelIds.includes(modelId)
    },
    manualModelIdsOf({ config }: { config: unknown }): string[] | undefined {
        const parsed = ManualModelsConfig.safeParse(config)
        return parsed.success ? parsed.data.models.map((model) => model.modelId) : undefined
    },
    keyOffersModel({ key, modelId }: { key: Pick<AIProviderSchema, 'modelScope' | 'modelIds'> & { config: unknown }, modelId: string }): boolean {
        const manualModelIds = aiKeyScope.manualModelIdsOf({ config: key.config })
        return aiKeyScope.scopeAllows({ modelScope: key.modelScope, modelIds: key.modelIds, modelId })
            && (isNil(manualModelIds) || manualModelIds.includes(modelId))
    },
}

const ManualModelsConfig = z.object({ models: z.array(z.object({ modelId: z.string() })) })

export type ProviderScope =
    | { type: 'project', projectId: string }
    | { type: 'platform' }
