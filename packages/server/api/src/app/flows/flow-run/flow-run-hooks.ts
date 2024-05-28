export type FlowRunHooks = {
    onFinish({
        projectId,
        tasks,
    }: {
        projectId: string
        tasks: number
    }): Promise<void>
}

const emptyHooks: FlowRunHooks = {
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
