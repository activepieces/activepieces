import { ActivepiecesError, ErrorCode, ProjectRole } from '@activepieces/shared'
import { hooksFactory } from '../helper/hooks-factory'

export type ProjectRoleHooks = {
    getOneOrThrowById(params: { id: string }): Promise<ProjectRole>
}

export const projectRoleHooks = hooksFactory.create<ProjectRoleHooks>(_log => ({
    async getOneOrThrowById({ id }: { id: string }): Promise<ProjectRole> {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityType: 'project_role', entityId: id, message: 'Project roles are not available in this edition' },
        })
    },
}))
