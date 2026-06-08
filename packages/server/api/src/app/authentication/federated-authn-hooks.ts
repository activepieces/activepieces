import { hooksFactory } from '../helper/hooks-factory'

export type FederatedAuthnHooks = {
    getThirdPartyRedirectUrl(): Promise<string>
}

export const federatedAuthnHooks = hooksFactory.create<FederatedAuthnHooks>(_log => ({
    async getThirdPartyRedirectUrl(): Promise<string> {
        return ''
    },
}))
