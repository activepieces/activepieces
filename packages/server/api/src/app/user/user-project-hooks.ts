import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EntityManager } from 'typeorm'
import { hooksFactory } from '../helper/hooks-factory'

export const userProjectHooks = hooksFactory.create<UserProjectHooks>(_log => ({
    addToProject: async (_params: AddToProjectParams) => {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: {
                message: 'Project roles are not enabled for this platform',
            },
        })
    },
}))

export type AddToProjectParams = {
    userId: string
    platformId: string
    projectId: string
    projectRoleName: string
    entityManager: EntityManager
}

export type UserProjectHooks = {
    addToProject(params: AddToProjectParams): Promise<void>
}
