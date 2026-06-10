import { Project } from '@activepieces/shared'
import { hooksFactory } from '../helper/hooks-factory'

export const projectHooks = hooksFactory.create<ProjectHooks>(_log => ({
    postCreate: async (_project: Project, _context?: ProjectPostCreateContext) => {
        return
    },
}))

export type ProjectPostCreateContext = {
    alertReceiverEmail?: string | null
}

export type ProjectHooks = {
    postCreate(project: Project, context?: ProjectPostCreateContext): Promise<void>
}
