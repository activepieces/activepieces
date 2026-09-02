import { ProjectId } from '@activepieces/core-utils'
import { EntityManager } from 'typeorm'
import { hooksFactory } from '../../helper/hooks-factory'

export const flowPublishHooks = hooksFactory.create<FlowPublishHooks>(() => ({
    async assertReferencesResolve(): Promise<void> {
        return
    },
}))

export type FlowPublishHooks = {
    assertReferencesResolve(params: { projectId: ProjectId, agentExternalIds: string[], entityManager: EntityManager }): Promise<void>
}
