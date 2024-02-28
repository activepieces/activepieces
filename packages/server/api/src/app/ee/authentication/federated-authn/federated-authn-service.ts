import { AuthenticationResponse } from '@activepieces/shared'
import {
    FederatedAuthnLoginResponse,
    ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared'
import { providers } from './authn-provider/authn-provider'
import { platformService } from '../../../platform/platform.service'

export const federatedAuthnService = {
    async login({
        providerName,
        platformId,
        hostname,
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const provider = providers[providerName]
        const platform = await platformService.getOneOrThrow(platformId)
        const loginUrl = await provider.getLoginUrl(hostname, platform)

        return {
            loginUrl,
        }
    },

    async claim({
        hostname,
        platformId,
        providerName,
        code,
    }: ClaimParams): Promise<AuthenticationResponse> {
        const provider = providers[providerName]
        const platform = await platformService.getOneOrThrow(platformId)
        return provider.authenticate(hostname, platform, code)
    },
}

type LoginParams = {
    platformId: string
    hostname: string
    providerName: ThirdPartyAuthnProviderEnum
}

type ClaimParams = {
    platformId: string
    hostname: string
    providerName: ThirdPartyAuthnProviderEnum
    code: string
}
