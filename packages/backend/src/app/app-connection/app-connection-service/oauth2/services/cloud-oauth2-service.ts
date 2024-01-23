import { ActivepiecesError, AppConnectionType, CloudOAuth2ConnectionValue, ErrorCode } from '@activepieces/shared'
import axios from 'axios'
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'

import { ClaimOAuth2Request, OAuth2Service, RefreshOAuth2Request } from '../oauth2-service'
import { getEdition } from '../../../../helper/secret-helper'
import { logger } from '../../../../helper/logger'

export const cloudOAuth2Service: OAuth2Service<CloudOAuth2ConnectionValue> = {
    refresh,
    claim,
}

async function refresh({ pieceName, connectionValue }: RefreshOAuth2Request<CloudOAuth2ConnectionValue>): Promise<CloudOAuth2ConnectionValue> {
    const requestBody = {
        refreshToken: connectionValue.refresh_token,
        pieceName,
        clientId: connectionValue.client_id,
        edition: getEdition(),
        authorizationMethod: connectionValue.authorization_method,
        tokenUrl: connectionValue.token_url,
    }
    const response = (await axios.post('https://secrets.activepieces.com/refresh', requestBody, { timeout: 10000 })).data
    return {
        ...connectionValue,
        ...response,
        type: AppConnectionType.CLOUD_OAUTH2,
    }
}

async function claim({ request, pieceName }: ClaimOAuth2Request): Promise<CloudOAuth2ConnectionValue> {
    try {
        const cloudRequest: ClaimWithCloudRequest = {
            code: request.code,
            codeVerifier: request.codeVerifier,
            authorizationMethod: request.authorizationMethod,
            clientId: request.clientId,
            tokenUrl: request.tokenUrl,
            pieceName,
            edition: getEdition(),
        }
        return (await axios.post<CloudOAuth2ConnectionValue>('https://secrets.activepieces.com/claim', cloudRequest, {
            timeout: 10000,
        })).data
    }
    catch (e: unknown) {
        logger.error(e)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CLOUD_CLAIM,
            params: {
                pieceName,
            },
        })
    }
}

type ClaimWithCloudRequest = {
    pieceName: string
    code: string
    codeVerifier: string | undefined
    authorizationMethod: OAuth2AuthorizationMethod | undefined
    edition: string
    clientId: string
    tokenUrl: string
}
