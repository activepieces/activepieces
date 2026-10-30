
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'
import { safeHttp } from '@activepieces/server-utils'
import { AppConnectionType, CloudOAuth2ConnectionValue } from '@activepieces/shared'
import { AxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { sleep } from '../../../../helper/sleep'
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
            await safeHttp.retryingAxios.post('https://secrets.activepieces.com/refresh', requestBody, {
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
            const value = await postClaim(cloudRequest)
            return {
                ...value,
                token_url: request.tokenUrl,
                props: request.props,
            }
        }
        catch (e: unknown) {
            log.error({
                error: e,
                piece: { name: pieceName },
                secretsService: describeSecretsServiceReply(e),
            }, '[cloudOAuth2Service#claim] Secrets service could not claim the authorization code')
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CLOUD_CLAIM,
                params: {
                    pieceName,
                },
            })
        }
    },
})

async function postClaim(cloudRequest: ClaimWithCloudRequest, attempt = 1): Promise<CloudOAuth2ConnectionValue> {
    try {
        const response = await safeHttp.axios.post<CloudOAuth2ConnectionValue>(
            'https://secrets.activepieces.com/claim',
            cloudRequest,
            {
                timeout: 10000,
            },
        )
        return response.data
    }
    catch (e: unknown) {
        if (attempt < MAX_CLAIM_ATTEMPTS && cloudflareNeverReachedSecretsService(e)) {
            await sleep(CLAIM_RETRY_DELAY_MS)
            return postClaim(cloudRequest, attempt + 1)
        }
        throw e
    }
}

function cloudflareNeverReachedSecretsService(e: unknown): boolean {
    return e instanceof AxiosError
        && !isNil(e.response)
        && CLOUDFLARE_ORIGIN_NOT_REACHED_STATUSES.includes(e.response.status)
}

function describeSecretsServiceReply(e: unknown): SecretsServiceReply {
    if (!(e instanceof AxiosError) || isNil(e.response)) {
        return {}
    }
    const oauth2Error = OAuth2ErrorReply.safeParse(e.response.data)
    return {
        responseStatus: e.response.status,
        oauthError: oauth2Error.data?.error?.slice(0, MAX_OAUTH2_ERROR_LENGTH),
        oauthErrorDescription: oauth2Error.data?.error_description?.slice(0, MAX_OAUTH2_ERROR_LENGTH),
    }
}

const MAX_OAUTH2_ERROR_LENGTH = 300

const MAX_CLAIM_ATTEMPTS = 3

const CLAIM_RETRY_DELAY_MS = 2000

const CLOUDFLARE_ORIGIN_NOT_REACHED_STATUSES = [521, 523, 525, 526]

const OAuth2ErrorReply = z.object({
    error: z.string().optional(),
    error_description: z.string().optional(),
})

type SecretsServiceReply = {
    responseStatus?: number
    oauthError?: string
    oauthErrorDescription?: string
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
