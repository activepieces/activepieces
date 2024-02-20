export type AppConnectionHooks = {
    preUpsert({ projectId }: { projectId: string }): Promise<void>
}

const emptyHooks: AppConnectionHooks = {
    async preUpsert() {
    // DO NOTHING
    },
}

let hooks = emptyHooks

export const appConnectionsHooks = {
    setHooks(newHooks: AppConnectionHooks) {
        hooks = newHooks
    },
    getHooks() {
        return hooks
    },
}
