import { hooksFactory } from './hooks-factory'

export type EmbedSubdomainHooks = {
    getByHostname(params: { hostname: string }): Promise<{ platformId: string } | null>
}

export const embedSubdomainHooks = hooksFactory.create<EmbedSubdomainHooks>(_log => ({
    async getByHostname(_params: { hostname: string }): Promise<{ platformId: string } | null> {
        return null
    },
}))
