import { PlatformId } from '@activepieces/core-utils'
import { hooksFactory } from '../helper/hooks-factory'

export const verifiedDomainHooks = hooksFactory.create<VerifiedDomainHooks>(() => ({
    async findPlatformIdByDomain(): Promise<PlatformId | null> {
        return null
    },
}))

export type VerifiedDomainHooks = {
    findPlatformIdByDomain(params: { domain: string }): Promise<PlatformId | null>
}
