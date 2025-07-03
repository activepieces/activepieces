import { Project } from '@activepieces/shared'
import { hooksFactory } from '../helper/hooks-factory'

export type ProjectHooks = {
    postCreate(project: Project): Promise<void>
}

export const projectHooks = hooksFactory.create<ProjectHooks>(_log => ({
    postCreate: async (_project: Project) => {
        return
    },
}))