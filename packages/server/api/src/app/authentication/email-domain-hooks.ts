import { PlatformId } from '@activepieces/core-utils'
import { hooksFactory } from '../helper/hooks-factory'

export const emailDomainHooks = hooksFactory.create<EmailDomainHooks>(() => ({
    async listVerifiedDomains(): Promise<string[]> {
        return []
    },
}))

export type EmailDomainHooks = {
    listVerifiedDomains(params: { platformId: PlatformId }): Promise<string[]>
}
