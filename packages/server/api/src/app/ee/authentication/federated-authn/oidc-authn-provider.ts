import {
    assertNotNullOrUndefined,
    isNil,
} from '@activepieces/shared'
import { AppSystemProp } from '@activepieces/server-shared'
import https from 'node:https'
import { FastifyBaseLogger } from 'fastify'
import jwksClient from 'jwks-rsa'
import { Agent as UndiciAgent } from 'undici'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { system } from '../../../helper/system/system'
import { federatedAuthnService } from './federated-authn-service'

const openIdConfigCache = new Map<string, OpenIdConfiguration>()
const jwksClientCache = new Map<string, ReturnType<typeof jwksClient>>()

let insecureTlsUndiciDispatcher: UndiciAgent | undefined
let insecureTlsHttpsAgent: https.Agent | undefined

export const oidcAuthnProvider = (log: FastifyBaseLogger) => ({
    async getLoginUrl(params: GetLoginUrlParams): Promise<string> {
        const { issuerUrl, clientId, scope, platformId } = params
        const openIdConfig = await getOpenIdConfiguration(issuerUrl)

        const loginUrl = new URL(openIdConfig.authorization_endpoint)
        loginUrl.searchParams.set('client_id', clientId)
        loginUrl.searchParams.set(
            'redirect_uri',
            await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
        )
        loginUrl.searchParams.set('scope', normalizeScope(scope))
        loginUrl.searchParams.set('response_type', 'code')

        return loginUrl.href
    },

    async authenticate(params: AuthenticateParams): Promise<FederatedAuthnIdToken> {
        const {
            issuerUrl,
            clientId,
            clientSecret,
            authorizationCode,
            platformId,
        } = params

        const openIdConfig = await getOpenIdConfiguration(issuerUrl)
        const tokens = await exchangeCodeForTokens({
            log,
            tokenEndpoint: openIdConfig.token_endpoint,
            platformId,
            clientId,
            clientSecret,
            code: authorizationCode,
        })

        const verified = await verifyIdToken({
            idToken: tokens.idToken,
            clientId,
            issuer: openIdConfig.issuer,
            jwksUri: openIdConfig.jwks_uri,
        })

        if (!isNil(verified.email)) {
            return {
                email: verified.email,
                firstName: verified.firstName,
                lastName: verified.lastName,
                imageUrl: verified.imageUrl,
            }
        }

        const userInfoEndpoint = openIdConfig.userinfo_endpoint
        if (isNil(userInfoEndpoint) || userInfoEndpoint.length === 0) {
            throw new Error('Email is missing from id_token and issuer does not expose userinfo_endpoint')
        }
        if (isNil(tokens.accessToken)) {
            throw new Error('Email is missing from id_token and token response did not include access_token')
        }

        const userInfo = await fetchUserInfo({
            endpoint: userInfoEndpoint,
            accessToken: tokens.accessToken,
        })

        const emailFromUserInfo = extractEmailFromUserInfo(userInfo)
        assertNotNullOrUndefined(
            emailFromUserInfo,
            'Email is missing from id_token and userinfo response. Ensure OIDC scopes include email and the IdP returns an email claim.',
        )

        const { firstName, lastName } = extractName({
            givenName: userInfo.given_name,
            familyName: userInfo.family_name,
            fullName: userInfo.name,
        }, {
            givenName: verified.firstName,
            familyName: verified.lastName,
            fullName: undefined,
        })

        return {
            email: emailFromUserInfo,
            firstName,
            lastName,
            imageUrl: userInfo.picture ?? verified.imageUrl,
        }
    },
})

function normalizeScope(scope: string | undefined): string {
    const effectiveScope = (scope ?? 'openid email profile').trim()
    const parts = effectiveScope.split(/\s+/).filter(Boolean)
    const hasOpenId = parts.some((p) => p.toLowerCase() === 'openid')
    if (hasOpenId) {
        return parts.join(' ')
    }
    return ['openid', ...parts].join(' ')
}

async function getOpenIdConfiguration(issuerUrl: string): Promise<OpenIdConfiguration> {
    const normalizedIssuer = issuerUrl.replace(/\/+$/, '')
    const cached = openIdConfigCache.get(normalizedIssuer)
    if (!isNil(cached)) {
        return cached
    }

    const discoveryUrl = `${normalizedIssuer}/.well-known/openid-configuration`
    const response = await oidcFetch(discoveryUrl)
    if (!response.ok) {
        throw new Error(`Failed to fetch OIDC discovery document: ${response.status} ${response.statusText}`)
    }

    const config = await response.json() as OpenIdConfiguration
    assertNotNullOrUndefined(config.authorization_endpoint, 'authorization_endpoint is missing')
    assertNotNullOrUndefined(config.token_endpoint, 'token_endpoint is missing')
    assertNotNullOrUndefined(config.jwks_uri, 'jwks_uri is missing')
    assertNotNullOrUndefined(config.issuer, 'issuer is missing')

    openIdConfigCache.set(normalizedIssuer, config)
    return config
}

async function exchangeCodeForTokens(params: {
    log: FastifyBaseLogger
    tokenEndpoint: string
    platformId: string | undefined
    clientId: string
    clientSecret: string
    code: string
}): Promise<{ idToken: string; accessToken?: string }> {
    const { log, tokenEndpoint, platformId, clientId, clientSecret, code } = params

    const response = await oidcFetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
            grant_type: 'authorization_code',
        }),
    })

    const payload = await response.json() as {
        id_token?: string
        access_token?: string
        error?: string
        error_description?: string
    }
    if (!response.ok) {
        const details = payload.error_description ?? payload.error ?? `${response.status} ${response.statusText}`
        throw new Error(`OIDC token exchange failed: ${details}`)
    }

    assertNotNullOrUndefined(payload.id_token, 'id_token is missing from token response')
    return {
        idToken: payload.id_token,
        accessToken: payload.access_token,
    }
}

async function verifyIdToken(params: {
    idToken: string
    clientId: string
    issuer: string
    jwksUri: string
}): Promise<{ email?: string; firstName: string; lastName: string; imageUrl?: string }> {
    const { idToken, clientId, issuer, jwksUri } = params

    const { header } = jwtUtils.decode({ jwt: idToken })
    const client = getOrCreateJwksClient(jwksUri, isOidcInsecureTlsEnabled())
    const signingKey = await client.getSigningKey(header.kid)
    const publicKey = signingKey.getPublicKey()

    const payload = await jwtUtils.decodeAndVerify<OidcIdTokenPayloadRaw>({
        jwt: idToken,
        key: publicKey,
        issuer,
        algorithm: JwtSignAlgorithm.RS256,
        audience: clientId,
    })

    if (payload.email_verified === false) {
        throw new Error('Email is not verified')
    }

    const email = payload.email
    const { firstName, lastName } = extractName({
        givenName: payload.given_name,
        familyName: payload.family_name,
        fullName: payload.name,
    })

    return {
        email,
        firstName,
        lastName,
        imageUrl: payload.picture,
    }
}

function getOrCreateJwksClient(jwksUri: string, insecureTls: boolean) {
    const cacheKey = `${jwksUri}|insecureTls=${insecureTls}`
    const cached = jwksClientCache.get(cacheKey)
    if (!isNil(cached)) {
        return cached
    }

    const created = jwksClient({
        rateLimit: true,
        cache: true,
        jwksUri,
        ...(insecureTls ? { requestAgent: getOrCreateInsecureTlsHttpsAgent() } : {}),
    })
    jwksClientCache.set(cacheKey, created)
    return created
}

function isOidcInsecureTlsEnabled(): boolean {
    return system.getBoolean(AppSystemProp.OIDC_INSECURE_TLS) ?? false
}

function getOrCreateInsecureTlsUndiciDispatcher(): UndiciAgent {
    if (!isNil(insecureTlsUndiciDispatcher)) {
        return insecureTlsUndiciDispatcher
    }
    insecureTlsUndiciDispatcher = new UndiciAgent({
        connect: {
            rejectUnauthorized: false,
        },
    })
    return insecureTlsUndiciDispatcher
}

function getOrCreateInsecureTlsHttpsAgent(): https.Agent {
    if (!isNil(insecureTlsHttpsAgent)) {
        return insecureTlsHttpsAgent
    }
    insecureTlsHttpsAgent = new https.Agent({
        rejectUnauthorized: false,
    })
    return insecureTlsHttpsAgent
}

function oidcFetch(input: string, init?: RequestInit): Promise<Response> {
    if (!isOidcInsecureTlsEnabled()) {
        return fetch(input, init)
    }
    // NOTE: This is intended for local/dev use with self-signed IdPs.
    // It is scoped to OIDC HTTP calls only (does not change global TLS behavior).
    return fetch(input, {
        ...init,
        // undici dispatcher controls TLS behavior for Node's fetch
        dispatcher: getOrCreateInsecureTlsUndiciDispatcher(),
    } as RequestInit)
}

function extractName(
    primary: { givenName?: string; familyName?: string; fullName?: string },
    secondary?: { givenName?: string; familyName?: string; fullName?: string },
): { firstName: string; lastName: string } {
    const givenName = primary.givenName ?? secondary?.givenName
    const familyName = primary.familyName ?? secondary?.familyName
    const fullName = primary.fullName ?? secondary?.fullName

    if (!isNil(givenName) || !isNil(familyName)) {
        return {
            firstName: givenName ?? 'john',
            lastName: familyName ?? 'doe',
        }
    }

    if (!isNil(fullName)) {
        const trimmed = fullName.trim()
        if (trimmed.length > 0) {
            const [first, ...rest] = trimmed.split(/\s+/)
            return {
                firstName: first ?? 'john',
                lastName: rest.join(' ') || 'doe',
            }
        }
    }

    return {
        firstName: 'john',
        lastName: 'doe',
    }
}

async function fetchUserInfo(params: { endpoint: string; accessToken: string }): Promise<OidcUserInfo> {
    const { endpoint, accessToken } = params
    const response = await oidcFetch(endpoint, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
        },
    })
    if (!response.ok) {
        throw new Error(`Failed to fetch OIDC userinfo: ${response.status} ${response.statusText}`)
    }
    return await response.json() as OidcUserInfo
}

function extractEmailFromUserInfo(userInfo: OidcUserInfo): string | undefined {
    if (!isNil(userInfo.email) && userInfo.email.includes('@')) {
        return userInfo.email
    }

    // Some IdPs put email-like values in preferred_username / upn.
    const candidates = [userInfo.preferred_username, userInfo.upn].filter((v): v is string => !isNil(v))
    for (const c of candidates) {
        if (c.includes('@')) {
            return c
        }
    }
    return undefined
}

type OpenIdConfiguration = {
    issuer: string
    authorization_endpoint: string
    token_endpoint: string
    jwks_uri: string
    userinfo_endpoint?: string
}

type GetLoginUrlParams = {
    issuerUrl: string
    clientId: string
    scope?: string
    platformId: string | undefined
}

type AuthenticateParams = {
    issuerUrl: string
    clientId: string
    clientSecret: string
    authorizationCode: string
    platformId: string | undefined
}

export type FederatedAuthnIdToken = {
    email: string
    firstName: string
    lastName: string
    imageUrl?: string
}

type OidcIdTokenPayloadRaw = {
    sub: string
    aud: string
    iss: string
    email?: string
    email_verified?: boolean
    given_name?: string
    family_name?: string
    name?: string
    picture?: string
    preferred_username?: string
}

type OidcUserInfo = {
    sub?: string
    email?: string
    email_verified?: boolean
    given_name?: string
    family_name?: string
    name?: string
    picture?: string
    preferred_username?: string
    upn?: string
}
