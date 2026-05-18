import { createHash, randomBytes } from 'crypto'
import { PropertyType } from '@activepieces/pieces-framework'
import { ActivepiecesError,
    AppConnection,
    AppConnectionType,
    assertNotNullOrUndefined,
    BaseOAuth2ConnectionValue,
    deleteProps,
    ErrorCode,
    GetOAuth2AuthorizationUrlResponse,
    OAuth2GrantType,
    PlatformId,
    resolveValueFromProps,
} from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { secretManagersService } from '../../../ee/secret-managers/secret-managers.service'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'

export const oauth2Util = (log: FastifyBaseLogger) => ({
    formatOAuth2Response: (response: Omit<BaseOAuth2ConnectionValue, 'claimed_at'>): BaseOAuth2ConnectionValue => {
        const secondsSinceEpoch = Math.round(Date.now() / 1000)
        const formattedResponse: BaseOAuth2ConnectionValue = {
            ...response,
            data: response,
            claimed_at: secondsSinceEpoch,
        }

        deleteProps(formattedResponse.data, [
            'access_token',
            'expires_in',
            'refresh_token',
            'scope',
            'token_type',
        ])
        return formattedResponse
    },
    isExpired: (connection: BaseOAuth2ConnectionValue): boolean => {
        const secondsSinceEpoch = Math.round(Date.now() / 1000)
        const grantType = connection.grant_type ?? OAuth2GrantType.AUTHORIZATION_CODE
        if (
            grantType === OAuth2GrantType.AUTHORIZATION_CODE &&
            !connection.refresh_token
        ) {
            return false
        }
        const expiresIn = connection.expires_in ?? 60 * 60
        const refreshThreshold = 15 * 60
        return (
            secondsSinceEpoch + refreshThreshold >= connection.claimed_at + expiresIn
        )
    },
    isUserError: (e: unknown): boolean => {
        if (isAxiosError(e)) {
            const error = e.response?.data.error
            switch (error) {
                case 'invalid_grant':
                    return true
                case 'invalid_request':
                case 'invalid_client':
                case 'invalid_scope':
                case 'unauthorized_client':
                case 'unsupported_grant_type':
                default:
                    return false
            }
        }
        return false
    },
    getOAuth2TokenUrl: async ({
        platformId,
        pieceName,
        pieceVersion,
        props,
    }: OAuth2TokenUrlParams): Promise<string> => {
        const pieceMetadata = await pieceMetadataService(log).getOrThrow({
            name: pieceName,
            platformId,
            version: pieceVersion,
        })
        const pieceAuth = Array.isArray(pieceMetadata.auth) ? pieceMetadata.auth.find(auth => auth.type === PropertyType.OAUTH2) : pieceMetadata.auth
        assertNotNullOrUndefined(pieceAuth, 'auth')
        switch (pieceAuth.type) {
            case PropertyType.OAUTH2:
                return resolveValueFromProps(props, pieceAuth.tokenUrl)
            default:
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_APP_CONNECTION,
                    params: {
                        error: 'invalid auth type',
                    },
                })
        }
    },
    buildAuthorizationUrl: async ({
        platformId,
        pieceName,
        pieceVersion,
        clientId,
        redirectUrl,
        projectId,
        props,
    }: BuildAuthorizationUrlParams): Promise<GetOAuth2AuthorizationUrlResponse> => {
        const pieceMetadata = await pieceMetadataService(log).getOrThrow({
            name: pieceName,
            platformId,
            version: pieceVersion,
        })
        const pieceAuth = Array.isArray(pieceMetadata.auth)
            ? pieceMetadata.auth.find(auth => auth.type === PropertyType.OAUTH2)
            : pieceMetadata.auth
        assertNotNullOrUndefined(pieceAuth, 'auth')
        if (pieceAuth.type !== PropertyType.OAUTH2) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_APP_CONNECTION,
                params: { error: 'invalid auth type' },
            })
        }

        const resolvedClientId = await secretManagersService(log).resolveString({
            key: clientId,
            platformId,
            throwOnFailure: true,
            projectIds: projectId ? [projectId] : undefined,
        })
        const authUrl = resolveValueFromProps(props, pieceAuth.authUrl)
        const scope = resolveValueFromProps(props, pieceAuth.scope.join(' '))

        const queryParams: Record<string, string> = {
            response_type: 'code',
            client_id: resolvedClientId,
            redirect_uri: redirectUrl,
            access_type: 'offline',
            state: nanoid(),
            prompt: 'consent',
            scope,
            ...(pieceAuth.extra ?? {}),
        }

        const prompt = pieceAuth.prompt
        if (prompt === 'omit') {
            delete queryParams['prompt']
        }
        else if (prompt !== undefined && prompt !== null) {
            queryParams['prompt'] = prompt
        }

        let codeVerifier: string | undefined
        if (pieceAuth.pkce) {
            codeVerifier = randomBytes(32).toString('base64url').slice(0, 43)
            const method = pieceAuth.pkceMethod ?? 'plain'
            queryParams['code_challenge_method'] = method
            if (method === 'S256') {
                const hash = createHash('sha256').update(codeVerifier).digest()
                queryParams['code_challenge'] = Buffer.from(hash).toString('base64url')
            }
            else {
                queryParams['code_challenge'] = codeVerifier
            }
        }

        const url = new URL(authUrl)
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== '') {
                url.searchParams.append(key, value)
            }
        })

        return {
            authorizationUrl: url.toString(),
            codeVerifier,
        }
    },
    removeRefreshTokenAndClientSecret: (connection: AppConnection): AppConnection => {
        if (connection.value.type === AppConnectionType.OAUTH2 && connection.value.grant_type === OAuth2GrantType.CLIENT_CREDENTIALS) {
            connection.value.client_secret = '(REDACTED)'
        }
        if (connection.value.type === AppConnectionType.OAUTH2
            || connection.value.type === AppConnectionType.CLOUD_OAUTH2
            || connection.value.type === AppConnectionType.PLATFORM_OAUTH2) {
            connection.value = {
                ...connection.value,
                refresh_token: '(REDACTED)',
            }
        }
        return connection
    },
})

type OAuth2TokenUrlParams = {
    platformId: PlatformId
    pieceName: string
    pieceVersion?: string
    props?: Record<string, unknown>
}

type BuildAuthorizationUrlParams = {
    platformId: PlatformId
    pieceName: string
    pieceVersion?: string
    clientId: string
    redirectUrl: string
    props?: Record<string, unknown>
    projectId?: string
}
