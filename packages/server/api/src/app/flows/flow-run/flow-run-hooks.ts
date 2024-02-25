export type FlowRunHooks = {
    onPreStart({ projectId }: { projectId: string }): Promise<void>
}

const emptyHooks: FlowRunHooks = {
    async onPreStart() {
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
