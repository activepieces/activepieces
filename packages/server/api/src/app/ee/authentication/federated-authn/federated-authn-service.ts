import { AppSystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, AuthenticationResponse,
    FederatedAuthnLoginResponse,
    isNil,
    ThirdPartyAuthnProviderEnum,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { domainHelper } from '../../custom-domains/domain-helper'
import { googleAuthnProvider } from './google-authn-provider'
import { oidcAuthnProvider } from './oidc-authn-provider'

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
    async login({
        platformId,
        providerName,
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const loginUrl = await getLoginUrl({
            log,
            platformId,
            providerName,
        })

        return {
            loginUrl,
        }
    },

    async claim({
        platformId,
        code,
        providerName,
    }: ClaimParams): Promise<AuthenticationResponse> {
        const idToken = await authenticate({
            log,
            platformId,
            providerName,
            code,
        })

        return authenticationService(log).federatedAuthn({
            email: idToken.email,
            firstName: idToken.firstName ?? 'john',
            lastName: idToken.lastName ?? 'doe',
            trackEvents: true,
            newsLetter: true,
            provider:
                providerName === ThirdPartyAuthnProviderEnum.GOOGLE
                    ? UserIdentityProvider.GOOGLE
                    : UserIdentityProvider.OIDC,
            predefinedPlatformId: platformId ?? null,
            imageUrl: idToken.imageUrl,
        })
    },
    async getThirdPartyRedirectUrl(
        platformId: string | undefined,
    ): Promise<string> {
        return domainHelper.getInternalUrl({
            path: '/redirect',
            platformId,
        })
    },
})

async function getLoginUrl(params: {
    log: FastifyBaseLogger
    platformId: string | undefined
    providerName: ThirdPartyAuthnProviderEnum
}): Promise<string> {
    const { log, platformId, providerName } = params
    if (providerName === ThirdPartyAuthnProviderEnum.GOOGLE) {
        const { clientId } = await getGoogleClientConfig(platformId)
        return googleAuthnProvider(log).getLoginUrl({
            clientId,
            platformId,
        })
    }
    if (providerName === ThirdPartyAuthnProviderEnum.OIDC) {
        const { issuerUrl, clientId, scope } = await getOidcClientConfig(platformId)
        return oidcAuthnProvider(log).getLoginUrl({
            issuerUrl,
            clientId,
            scope,
            platformId,
        })
    }
    throw new Error(`Unsupported federated auth provider: ${providerName}`)
}

async function authenticate(params: {
    log: FastifyBaseLogger
    platformId: string | undefined
    providerName: ThirdPartyAuthnProviderEnum
    code: string
}) {
    const { log, platformId, providerName, code } = params
    if (providerName === ThirdPartyAuthnProviderEnum.GOOGLE) {
        const { clientId, clientSecret } = await getGoogleClientConfig(platformId)
        return googleAuthnProvider(log).authenticate({
            clientId,
            clientSecret,
            authorizationCode: code,
            platformId,
        })
    }
    if (providerName === ThirdPartyAuthnProviderEnum.OIDC) {
        const { issuerUrl, clientId, clientSecret } = await getOidcClientConfig(platformId)
        return oidcAuthnProvider(log).authenticate({
            issuerUrl,
            clientId,
            clientSecret,
            authorizationCode: code,
            platformId,
        })
    }
    throw new Error(`Unsupported federated auth provider: ${providerName}`)
}

async function getGoogleClientConfig(platformId: string | undefined) {
    if (isNil(platformId)) {
        return {
            clientId: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_ID),
            clientSecret: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_SECRET),
        }
    }
    const platform = await platformService.getOneOrThrow(platformId)
    const clientInformation = platform.federatedAuthProviders.google
    if (isNil(clientInformation)) {
        // Self-hosted/local setups may have a resolvable platformId but still prefer instance-level SSO config.
        return {
            clientId: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_ID),
            clientSecret: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_SECRET),
        }
    }
    return {
        clientId: clientInformation.clientId,
        clientSecret: clientInformation.clientSecret,
    }
}

async function getOidcClientConfig(platformId: string | undefined) {
    if (isNil(platformId)) {
        return {
            issuerUrl: system.getOrThrow(AppSystemProp.OIDC_ISSUER_URL),
            clientId: system.getOrThrow(AppSystemProp.OIDC_CLIENT_ID),
            clientSecret: system.getOrThrow(AppSystemProp.OIDC_CLIENT_SECRET),
            scope: system.get(AppSystemProp.OIDC_SCOPE) ?? undefined,
        }
    }
    const platform = await platformService.getOneOrThrow(platformId)
    const clientInformation = platform.federatedAuthProviders.oidc
    if (isNil(clientInformation)) {
        // Self-hosted/local setups may have a resolvable platformId but still prefer instance-level SSO config.
        return {
            issuerUrl: system.getOrThrow(AppSystemProp.OIDC_ISSUER_URL),
            clientId: system.getOrThrow(AppSystemProp.OIDC_CLIENT_ID),
            clientSecret: system.getOrThrow(AppSystemProp.OIDC_CLIENT_SECRET),
            scope: system.get(AppSystemProp.OIDC_SCOPE) ?? undefined,
        }
    }
    return {
        issuerUrl: clientInformation.issuerUrl,
        clientId: clientInformation.clientId,
        clientSecret: clientInformation.clientSecret,
        scope: clientInformation.scope ?? undefined,
    }
}

type LoginParams = {
    platformId: string | undefined
    providerName: ThirdPartyAuthnProviderEnum
}

type ClaimParams = {
    platformId: string | undefined
    code: string
    providerName: ThirdPartyAuthnProviderEnum
}
