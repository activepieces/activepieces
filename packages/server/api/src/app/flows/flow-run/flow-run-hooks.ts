export type FlowRunHooks = {
    onPreStart({ projectId }: { projectId: string }): Promise<void>
    onFinish({
        projectId,
        tasks,
    }: {
        projectId: string
        tasks: number
    }): Promise<void>
}

const emptyHooks: FlowRunHooks = {
    async onPreStart() {
    // DO NOTHING
    },
    async onFinish() {
        // DO NOTHING
    },
}

let hooks = emptyHooks

export const flowRunHooks = {
    setHooks(newHooks: FlowRunHooks) {
        hooks = newHooks
    },
    getHooks() {
        return hooks
    },
}
