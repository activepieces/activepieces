import axios from 'axios'
import {
    ClaimOAuth2Request,
    OAuth2Service,
    RefreshOAuth2Request,
} from '../oauth2-service'
import { oauth2Util } from '../oauth2-util'
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'
import { logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    AppConnectionType,
    BaseOAuth2ConnectionValue,
    ErrorCode,
    isNil,
    OAuth2ConnectionValueWithApp,
    OAuth2GrantType,
} from '@activepieces/shared'

export const credentialsOauth2Service: OAuth2Service<OAuth2ConnectionValueWithApp> =
{
    refresh,
    claim,
}

async function claim({
    request,
}: ClaimOAuth2Request): Promise<OAuth2ConnectionValueWithApp> {
    try {
        const grantType = request.grantType ?? OAuth2GrantType.AUTHORIZATION_CODE
        const body: Record<string, string> = {
            grant_type: grantType,
        }
        switch (grantType) {
            case OAuth2GrantType.AUTHORIZATION_CODE: {
                body.redirect_uri = request.redirectUrl!
                body.code = request.code
                break
            }
            case OAuth2GrantType.CLIENT_CREDENTIALS:
                break
        }
        if (request.codeVerifier) {
            body.code_verifier = request.codeVerifier
        }
        if (request.props && grantType === OAuth2GrantType.CLIENT_CREDENTIALS) {
            Object.entries(request.props).forEach(([key, value]) => {
                body[key] = value
            })
        }
        const headers: Record<string, string> = {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
        }
        const authorizationMethod =
            request.authorizationMethod || OAuth2AuthorizationMethod.BODY
        switch (authorizationMethod) {
            case OAuth2AuthorizationMethod.BODY:
                body.client_id = request.clientId
                body.client_secret = request.clientSecret!
                break
            case OAuth2AuthorizationMethod.HEADER:
                headers.authorization = `Basic ${Buffer.from(
                    `${request.clientId}:${request.clientSecret}`,
                ).toString('base64')}`
                break
            default:
                throw new Error(`Unknown authorization method: ${authorizationMethod}`)
        }
        const response = (
            await axios.post(request.tokenUrl, new URLSearchParams(body), {
                headers,
            })
        ).data
        return {
            type: AppConnectionType.OAUTH2,
            ...oauth2Util.formatOAuth2Response(response),
            token_url: request.tokenUrl,
            client_id: request.clientId,
            client_secret: request.clientSecret!,
            redirect_url: request.redirectUrl!,
            grant_type: grantType,
            props: request.props,
            authorization_method: authorizationMethod,
        }
    }
    catch (e: unknown) {
        logger.error(e)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CLAIM,
            params: {
                clientId: request.clientId,
                tokenUrl: request.tokenUrl,
                redirectUrl: request.redirectUrl ?? '',
            },
        })
    }
}

async function refresh({
    connectionValue,
}: RefreshOAuth2Request<OAuth2ConnectionValueWithApp>): Promise<OAuth2ConnectionValueWithApp> {
    const appConnection = connectionValue
    if (!oauth2Util.isExpired(appConnection)) {
        return appConnection
    }
    const grantType =
        connectionValue.grant_type ?? OAuth2GrantType.AUTHORIZATION_CODE
    const body: Record<string, string> = {}
    switch (grantType) {
        case OAuth2GrantType.AUTHORIZATION_CODE: {
            body.grant_type = 'refresh_token'
            body.refresh_token = appConnection.refresh_token
            break
        }
        case OAuth2GrantType.CLIENT_CREDENTIALS: {
            body.grant_type = grantType
            break
        }
        default:
            throw new Error(`Unknown grant type: ${grantType}`)
    }

    const headers: Record<string, string> = {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
    }
    const authorizationMethod =
        appConnection.authorization_method || OAuth2AuthorizationMethod.BODY
    switch (authorizationMethod) {
        case OAuth2AuthorizationMethod.BODY:
            body.client_id = appConnection.client_id
            body.client_secret = appConnection.client_secret
            break
        case OAuth2AuthorizationMethod.HEADER:
            headers.authorization = `Basic ${Buffer.from(
                `${appConnection.client_id}:${appConnection.client_secret}`,
            ).toString('base64')}`
            break
        default:
            throw new Error(`Unknown authorization method: ${authorizationMethod}`)
    }
    const response = (
        await axios.post(appConnection.token_url, new URLSearchParams(body), {
            headers,
            timeout: 10000,
        })
    ).data
    const mergedObject = mergeNonNull(
        appConnection,
        oauth2Util.formatOAuth2Response({ ...response }),
    )
    return {
        ...mergedObject,
        props: appConnection.props,
    }
}

/**
 * When the refresh token is null or undefined, it indicates that the original connection's refresh token is also null
 * or undefined. Therefore, we only need to merge non-null values to avoid overwriting the original refresh token with a
 *  null or undefined value.
 */
function mergeNonNull(
    appConnection: OAuth2ConnectionValueWithApp,
    oAuth2Response: BaseOAuth2ConnectionValue,
): OAuth2ConnectionValueWithApp {
    const formattedOAuth2Response: Partial<BaseOAuth2ConnectionValue> =
        Object.fromEntries(
            Object.entries(oAuth2Response).filter(([, value]) => !isNil(value)),
        )

    return {
        ...appConnection,
        ...formattedOAuth2Response,
    } as OAuth2ConnectionValueWithApp
}
