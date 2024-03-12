import { ProjectId } from '@activepieces/shared'
import { flowService } from '../flows/flow/flow.service'
import { EntityManager } from 'typeorm'

export const projectSideEffects = {
    async onSoftDelete({ id, entityManager }: OnSoftDeleteParams): Promise<void> {
        await flowService.disableAllForProject({
            projectId: id,
            entityManager,
        })
    },
}

type OnSoftDeleteParams = {
    id: ProjectId
    entityManager: EntityManager
}
