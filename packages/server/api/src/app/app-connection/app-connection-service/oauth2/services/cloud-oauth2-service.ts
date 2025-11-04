
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'
import { apAxios } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    AppConnectionType,
    CloudOAuth2ConnectionValue,
    ErrorCode,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../../helper/system/system'
import {
    ClaimOAuth2Request,
    OAuth2Service,
    RefreshOAuth2Request,
} from '../oauth2-service'

export const cloudOAuth2Service = (log: FastifyBaseLogger): OAuth2Service<CloudOAuth2ConnectionValue> => ({
    refresh: async ({
        pieceName,
        connectionValue,
    }: RefreshOAuth2Request<CloudOAuth2ConnectionValue>): Promise<CloudOAuth2ConnectionValue> => {
        const requestBody = {
            refreshToken: connectionValue.refresh_token,
            pieceName,
            clientId: connectionValue.client_id,
            edition: system.getEdition(),
            authorizationMethod: connectionValue.authorization_method,
            tokenUrl: connectionValue.token_url,
        }
        const response = (
            await apAxios.post('https://secrets.activepieces.com/refresh', requestBody, {
                timeout: 20000,
            })
        ).data
        return {
            ...connectionValue,
            ...response,
            props: connectionValue.props,
            type: AppConnectionType.CLOUD_OAUTH2,
        }
    },
    claim: async ({
        request,
        pieceName,
    }: ClaimOAuth2Request): Promise<CloudOAuth2ConnectionValue> => {
        try {
            const cloudRequest: ClaimWithCloudRequest = {
                code: request.code,
                codeVerifier: request.codeVerifier,
                authorizationMethod: request.authorizationMethod,
                clientId: request.clientId,
                tokenUrl: request.tokenUrl,
                pieceName,
                edition: system.getEdition(),
            }
            const value = (
                await apAxios.post<CloudOAuth2ConnectionValue>(
                    'https://secrets.activepieces.com/claim',
                    cloudRequest,
                    {
                        timeout: 10000,
                    },
                )
            ).data
            return {
                ...value,
                token_url: request.tokenUrl,
                props: request.props,
            }
        }
        catch (e: unknown) {
            log.error(e)
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CLOUD_CLAIM,
                params: {
                    pieceName,
                },
            })
        }
    },
})

type ClaimWithCloudRequest = {
    pieceName: string
    code: string
    codeVerifier: string | undefined
    authorizationMethod: OAuth2AuthorizationMethod | undefined
    edition: string
    clientId: string
    tokenUrl: string
}
