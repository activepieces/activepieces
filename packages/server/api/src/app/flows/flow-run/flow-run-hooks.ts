export type FlowRunHooks = {
    onFinish({
        projectId,
        tasks,
    }: {
        projectId: string
        tasks: number
    }): Promise<void>
    limitTasksPerMonth({
        projectId,
        createdAt,
        tasks,
        consumedTasks,
        previousUsage,
    }: {
        projectId: string
        createdAt: string
        tasks: number
        consumedTasks: number
        previousUsage: number
    }): Promise<void> 
}

const emptyHooks: FlowRunHooks = {
    async onFinish() {
        // DO NOTHING
    },
    async limitTasksPerMonth() {
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
