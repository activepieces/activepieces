import { PropertyType } from '@activepieces/pieces-framework'
import { ActivepiecesError,
    AppConnection,
    AppConnectionType,
    assertNotNullOrUndefined,
    BaseOAuth2ConnectionValue,
    deleteProps,
    ErrorCode,
    OAuth2GrantType,
    PlatformId,
    resolveValueFromProps,
} from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'

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
        projectId,
        platformId,
        pieceName,
        props,
    }: OAuth2TokenUrlParams): Promise<string> => {
        const pieceMetadata = await pieceMetadataService(log).getOrThrow({
            name: pieceName,
            projectId,
            platformId,
            version: undefined,
        })
        const auth = pieceMetadata.auth
        assertNotNullOrUndefined(auth, 'auth')
        switch (auth.type) {
            case PropertyType.OAUTH2:
                return resolveValueFromProps(props, auth.tokenUrl)
            default:
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_APP_CONNECTION,
                    params: {
                        error: 'invalid auth type',
                    },
                })
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
    projectId: string | undefined
    platformId: PlatformId
    pieceName: string
    props?: Record<string, string>
}
