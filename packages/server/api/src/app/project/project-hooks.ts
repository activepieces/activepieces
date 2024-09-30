import { Project } from '@activepieces/shared'

export type ProjectHooks = {
    postCreate(project: Project): Promise<void>
}

const emptyHooks: ProjectHooks = {
    async postCreate() {
        // DO NOTHING
    },
}

let hooks = emptyHooks

export const projectHooks = {
    setHooks(newHooks: ProjectHooks) {
        hooks = newHooks
    },
    getHooks() {
        return hooks
    },
}
