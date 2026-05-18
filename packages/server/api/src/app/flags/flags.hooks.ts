import { FastifyRequest } from 'fastify'

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
    flags: Record<string, string | boolean | number | Record<string, unknown>>
    request: FastifyRequest
}

export type FlagsServiceHooks = {
    modify(params: CreateParams): Promise<Record<string, unknown>>
}
