
let hooks: FlagsServiceHooks = {
    async modify(params) {
        return params.flags
    },
}

export const flagHooks = {
    set(newHooks: FlagsServiceHooks): void {
        hooks = newHooks
    },

    get(): FlagsServiceHooks {
        return hooks
    },
}

type CreateParams = {
    flags: Record<string, unknown>
    hostname: string
    projectId: string
}

export type FlagsServiceHooks = {
    modify(params: CreateParams): Promise<Record<string, unknown>>
}
