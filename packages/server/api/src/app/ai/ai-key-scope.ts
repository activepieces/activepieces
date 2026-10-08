import { AiProviderModelScope } from '@activepieces/shared'
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
}

export type ProviderScope =
    | { type: 'project', projectId: string }
    | { type: 'platform' }
