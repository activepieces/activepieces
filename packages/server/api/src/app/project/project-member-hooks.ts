import { hooksFactory } from '../helper/hooks-factory'

export type ProjectMemberHooks = {
    upsert(params: { projectId: string, userId: string, projectRoleName: string }): Promise<void>
}

export const projectMemberHooks = hooksFactory.create<ProjectMemberHooks>(_log => ({
    async upsert(_params: { projectId: string, userId: string, projectRoleName: string }): Promise<void> {
        return
    },
}))
