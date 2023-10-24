
export type DatasourceHooks = {
    preSave({ projectId }: { projectId: string }): Promise<void>
}

const emptyHooks: DatasourceHooks = {
    async preSave() {
        // DO NOTHING
    },
}

let hooks = emptyHooks

export const datasourceHooks = {
    setHooks(newHooks: DatasourceHooks) {
        hooks = newHooks
    },
    getHooks() {
        return hooks
    },
}