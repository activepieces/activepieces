import { createHash, randomBytes } from 'crypto'
import { ALL_OAUTH_SCOPES, apId, isNil, PrincipalType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { jwtUtils } from '../../helper/jwt-utils'
import { OAuthAuthorizationCodeEntity, OAuthClientEntity, OAuthRefreshTokenEntity } from './oauth-entities'

const ACCESS_TOKEN_LIFETIME_SECONDS = 3600
const REFRESH_TOKEN_LIFETIME_DAYS = 30
const AUTH_CODE_LIFETIME_MINUTES = 10

const oauthClientRepo = repoFactory(OAuthClientEntity)
const oauthAuthCodeRepo = repoFactory(OAuthAuthorizationCodeEntity)
const oauthRefreshTokenRepo = repoFactory(OAuthRefreshTokenEntity)

function hashSecret(value: string): string {
    return createHash('sha256').update(value).digest('hex')
}

function generateSecureToken(): string {
    return randomBytes(32).toString('base64url')
}

export const oauthService = (log: FastifyBaseLogger) => ({

    async registerClient(params: RegisterClientParams): Promise<RegisterClientResponse> {
        const clientId = `ap_oauth_${apId()}`
        const hasSecret = !isNil(params.tokenEndpointAuthMethod) && params.tokenEndpointAuthMethod !== 'none'
        const clientSecret = hasSecret ? generateSecureToken() : null

        const entity = {
            id: apId(),
            clientId,
            clientSecretHash: clientSecret ? hashSecret(clientSecret) : null,
            clientName: params.clientName,
            redirectUris: params.redirectUris,
            grantTypes: params.grantTypes ?? ['authorization_code', 'refresh_token'],
            platformId: params.platformId,
        }
        await oauthClientRepo().save(entity)
        log.info({ clientId: entity.clientId }, 'OAuth client registered')

        return {
            clientId: entity.clientId,
            clientSecret,
            clientName: entity.clientName,
            redirectUris: entity.redirectUris,
            grantTypes: entity.grantTypes,
        }
    },

    async getClient(clientId: string, clientSecret: string | null): Promise<OAuthClientRecord | null> {
        const client = await oauthClientRepo().findOneBy({ clientId })
        if (isNil(client)) {
            return null
        }
        if (!isNil(clientSecret) && !isNil(client.clientSecretHash)) {
            if (hashSecret(clientSecret) !== client.clientSecretHash) {
                return null
            }
        }
        return client
    },

    async saveAuthorizationCode(params: SaveAuthCodeParams): Promise<string> {
        const code = generateSecureToken()
        const entity = {
            id: apId(),
            code,
            clientId: params.clientId,
            userId: params.userId,
            platformId: params.platformId,
            scopes: params.scopes,
            codeChallenge: params.codeChallenge,
            codeChallengeMethod: params.codeChallengeMethod,
            redirectUri: params.redirectUri,
            resource: params.resource ?? null,
            expiresAt: dayjs().add(AUTH_CODE_LIFETIME_MINUTES, 'minutes').toDate(),
            used: false,
        }
        await oauthAuthCodeRepo().save(entity)
        return code
    },

    async exchangeAuthorizationCode(params: ExchangeCodeParams): Promise<TokenResponse> {
        const authCode = await oauthAuthCodeRepo().findOneBy({ code: params.code })
        if (isNil(authCode)) {
            throw oauthError('invalid_grant', 'Authorization code not found')
        }
        if (authCode.used) {
            throw oauthError('invalid_grant', 'Authorization code already used')
        }
        if (dayjs().isAfter(dayjs(authCode.expiresAt))) {
            throw oauthError('invalid_grant', 'Authorization code expired')
        }
        if (authCode.clientId !== params.clientId) {
            throw oauthError('invalid_grant', 'Client ID mismatch')
        }
        if (authCode.redirectUri !== params.redirectUri) {
            throw oauthError('invalid_grant', 'Redirect URI mismatch')
        }

        verifyPkce(authCode.codeChallenge, authCode.codeChallengeMethod, params.codeVerifier)

        await oauthAuthCodeRepo().update({ id: authCode.id }, { used: true })

        const accessToken = await generateAccessToken({
            userId: authCode.userId,
            platformId: authCode.platformId,
            scopes: authCode.scopes,
            resource: authCode.resource,
        })

        const refreshToken = generateSecureToken()
        const refreshTokenHash = hashSecret(refreshToken)
        await oauthRefreshTokenRepo().save({
            id: apId(),
            tokenHash: refreshTokenHash,
            clientId: authCode.clientId,
            userId: authCode.userId,
            platformId: authCode.platformId,
            scopes: authCode.scopes,
            expiresAt: dayjs().add(REFRESH_TOKEN_LIFETIME_DAYS, 'days').toDate(),
            revoked: false,
        })

        log.info({ userId: authCode.userId }, 'OAuth tokens issued')

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
            refresh_token: refreshToken,
            scope: authCode.scopes.join(' '),
        }
    },

    async refreshAccessToken(params: RefreshTokenParams): Promise<TokenResponse> {
        const tokenHash = hashSecret(params.refreshToken)
        const stored = await oauthRefreshTokenRepo().findOneBy({ tokenHash })
        if (isNil(stored)) {
            throw oauthError('invalid_grant', 'Refresh token not found')
        }
        if (stored.revoked) {
            throw oauthError('invalid_grant', 'Refresh token revoked')
        }
        if (dayjs().isAfter(dayjs(stored.expiresAt))) {
            throw oauthError('invalid_grant', 'Refresh token expired')
        }
        if (stored.clientId !== params.clientId) {
            throw oauthError('invalid_grant', 'Client ID mismatch')
        }

        const accessToken = await generateAccessToken({
            userId: stored.userId,
            platformId: stored.platformId,
            scopes: stored.scopes,
            resource: null,
        })

        const newRefreshToken = generateSecureToken()
        const newRefreshTokenHash = hashSecret(newRefreshToken)

        await oauthRefreshTokenRepo().update({ id: stored.id }, { revoked: true })

        await oauthRefreshTokenRepo().save({
            id: apId(),
            tokenHash: newRefreshTokenHash,
            clientId: stored.clientId,
            userId: stored.userId,
            platformId: stored.platformId,
            scopes: stored.scopes,
            expiresAt: dayjs().add(REFRESH_TOKEN_LIFETIME_DAYS, 'days').toDate(),
            revoked: false,
        })

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
            refresh_token: newRefreshToken,
            scope: stored.scopes.join(' '),
        }
    },

    async revokeToken(params: RevokeTokenParams): Promise<void> {
        const tokenHash = hashSecret(params.token)
        const stored = await oauthRefreshTokenRepo().findOneBy({ tokenHash })
        if (!isNil(stored)) {
            await oauthRefreshTokenRepo().update({ id: stored.id }, { revoked: true })
            log.info({ userId: stored.userId }, 'OAuth refresh token revoked')
        }
    },

    async verifyAccessToken(token: string): Promise<OAuthAccessTokenPayload> {
        const secret = await jwtUtils.getJwtSecret()
        const decoded = await jwtUtils.decodeAndVerify<OAuthAccessTokenPayload>({
            jwt: token,
            key: secret,
        })
        if (decoded.type !== PrincipalType.OAUTH) {
            throw oauthError('invalid_token', 'Invalid token type')
        }
        return decoded
    },

    validateScopes(scopes: string[]): string[] {
        const validScopes = ALL_OAUTH_SCOPES as string[]
        return scopes.filter((s) => validScopes.includes(s))
    },
})

async function generateAccessToken(params: {
    userId: string
    platformId: string
    scopes: string[]
    resource: string | null
}): Promise<string> {
    const secret = await jwtUtils.getJwtSecret()
    return jwtUtils.sign({
        payload: {
            sub: params.userId,
            scope: params.scopes.join(' '),
            platformId: params.platformId,
            type: PrincipalType.OAUTH,
            ...(params.resource ? { aud: params.resource } : {}),
        },
        key: secret,
        expiresInSeconds: ACCESS_TOKEN_LIFETIME_SECONDS,
    })
}

function verifyPkce(codeChallenge: string, method: string, codeVerifier: string): void {
    if (isNil(codeVerifier)) {
        throw oauthError('invalid_grant', 'Code verifier required')
    }
    let computed: string
    if (method === 'S256') {
        computed = createHash('sha256').update(codeVerifier).digest('base64url')
    }
    else {
        throw oauthError('invalid_request', 'Unsupported code challenge method')
    }
    if (computed !== codeChallenge) {
        throw oauthError('invalid_grant', 'PKCE verification failed')
    }
}

function oauthError(error: string, description: string): OAuthError {
    return new OAuthError(error, description)
}

export class OAuthError extends Error {
    constructor(
        public readonly error: string,
        public readonly errorDescription: string,
    ) {
        super(errorDescription)
    }
}

type RegisterClientParams = {
    clientName: string
    redirectUris: string[]
    grantTypes?: string[]
    tokenEndpointAuthMethod?: string
    platformId: string
}

type RegisterClientResponse = {
    clientId: string
    clientSecret: string | null
    clientName: string
    redirectUris: string[]
    grantTypes: string[]
}

type OAuthClientRecord = {
    id: string
    clientId: string
    clientSecretHash: string | null
    clientName: string
    redirectUris: string[]
    grantTypes: string[]
    platformId: string
}

type SaveAuthCodeParams = {
    clientId: string
    userId: string
    platformId: string
    scopes: string[]
    codeChallenge: string
    codeChallengeMethod: string
    redirectUri: string
    resource?: string
}

type ExchangeCodeParams = {
    code: string
    clientId: string
    redirectUri: string
    codeVerifier: string
}

type RefreshTokenParams = {
    refreshToken: string
    clientId: string
}

type RevokeTokenParams = {
    token: string
}

type TokenResponse = {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    scope: string
}

export type OAuthAccessTokenPayload = {
    sub: string
    scope: string
    platformId: string
    type: PrincipalType.OAUTH
    aud?: string
}
