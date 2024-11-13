import { PropertyType } from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    AppConnection,
    AppConnectionType,
    assertNotNullOrUndefined,
    BaseOAuth2ConnectionValue,
    deleteProps,
    ErrorCode,
    OAuth2GrantType,
    PlatformId,
} from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'

export const oauth2Util = {
    formatOAuth2Response,
    isExpired,
    isUserError,
    getOAuth2TokenUrl,
    removeRefreshTokenAndClientSecret,
}

function removeRefreshTokenAndClientSecret(connection: AppConnection): AppConnection {
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
}

function isExpired(connection: BaseOAuth2ConnectionValue): boolean {
    const secondsSinceEpoch = Math.round(Date.now() / 1000)
    const grantType = connection.grant_type ?? OAuth2GrantType.AUTHORIZATION_CODE
    if (
        grantType === OAuth2GrantType.AUTHORIZATION_CODE &&
        !connection.refresh_token
    ) {
        return false
    }
    // Salesforce doesn't provide an 'expires_in' field, as it is dynamic per organization; therefore, it's necessary for us to establish a low threshold and consistently refresh it.
    const expiresIn = connection.expires_in ?? 60 * 60
    const refreshThreshold = 15 * 60 // Refresh if there is less than 15 minutes to expire
    return (
        secondsSinceEpoch + refreshThreshold >= connection.claimed_at + expiresIn
    )
}

async function getOAuth2TokenUrl({
    projectId,
    platformId,
    pieceName,
    props,
}: OAuth2TokenUrlParams): Promise<string> {
    const pieceMetadata = await pieceMetadataService.getOrThrow({
        name: pieceName,
        projectId,
        platformId,
        version: undefined,
    })
    const auth = pieceMetadata.auth
    assertNotNullOrUndefined(auth, 'auth')
    switch (auth.type) {
        case PropertyType.OAUTH2:
            return resolveUrl(auth.tokenUrl, props)
        default:
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_APP_CONNECTION,
                params: {
                    error: 'invalid auth type',
                },
            })
    }
}

type OAuth2TokenUrlParams = {
    projectId: string | undefined
    platformId: PlatformId
    pieceName: string
    props?: Record<string, string>
}


function resolveUrl(
    url: string,
    props: Record<string, unknown> | undefined,
): string {
    if (!props) {
        return url
    }
    for (const [key, value] of Object.entries(props)) {
        url = url.replace(`{${key}}`, String(value))
    }
    return url
}

function formatOAuth2Response(
    response: Omit<BaseOAuth2ConnectionValue, 'claimed_at'>,
): BaseOAuth2ConnectionValue {
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
}

function isUserError(e: unknown): boolean {
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

}