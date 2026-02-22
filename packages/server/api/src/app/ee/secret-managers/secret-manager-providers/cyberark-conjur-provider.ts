import { CyberarkConjurProviderConfig, CyberarkConjurGetSecretRequest, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/ee-shared'
import { apAxios } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'
import https from 'https'

export const CYBERARK_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.CYBERARK,
    name: 'Cyberark Conjur',
    logo: 'https://cdn.activepieces.com/pieces/cyberark-conjur.png',
    fields: {
        loginId: {
            displayName: 'Login ID',
            placeholder: 'login-id',
        },
        url: {
            displayName: 'URL',
            placeholder: 'https://conjur.example.com',
        },
        apiKey: {
            displayName: 'API Key',
            placeholder: 'your-api-key',
        },
    },
    getSecretParams: {
        secretKey: {
            displayName: 'Secret key',
            placeholder: 'secret-key',
        },
    },
}

export const cyberarkConjurProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.CYBERARK> => ({
    checkConnection: async (config) => {
        
        const response = await conjurApi({
            url: `${config.url}/authn/myConjurAccount/${encodeURIComponent(config.loginId)}/authenticate`,
            method: 'POST',
            body: config.apiKey,
        }).catch((error) => {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message: error.message,
                    provider: SecretManagerProviderId.CYBERARK,
                },
            })
        })
        const token = response.data
        if (!token) {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message: 'No token received',
                    provider: SecretManagerProviderId.CYBERARK,
                },
            })
        }
        return Buffer.from(String(token).trim(), 'utf8').toString('base64')
    },
    connect: async (config) => {
        await cyberarkConjurProvider(log).checkConnection(config)
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (request: CyberarkConjurGetSecretRequest, config: CyberarkConjurProviderConfig) => {

        const token = await cyberarkConjurProvider(log).checkConnection(config) as string

        console.error('token', token)
        const response = await conjurApi({
            url: `${config.url}/secrets/myConjurAccount/variable/${request.secretKey}`,
            token,
            method: 'GET',
        }).catch((error) => {
            log.error({
                message: error.message,
                provider: SecretManagerProviderId.CYBERARK,
                request,
            }, '[cyberarkConjurProvider#getSecret]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: error.message,
                    provider: SecretManagerProviderId.CYBERARK,
                    request,
                },
            })
        })
        const data = response.data
        console.error('data', data)
        if (!data) {
            log.error({
                message: 'No secret found at requested path',
                provider: SecretManagerProviderId.CYBERARK,
                request,
            }, '[cyberarkConjurProvider#getSecret]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: 'No secret found at requested path',
                    provider: SecretManagerProviderId.CYBERARK,
                    request,
                },
            })
        }
        return data
    },
    resolve: async (key: string) => {
        const splits = key.split(':')
        if (splits.length < 2) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Wrong key format . should be providerName:secret-key',
                },
            })
        }
       
        return {
            secretKey: splits[1],
        }
    },
})

const conjurApi = async ({
    url,
    token,
    method,
    body,
}: {
    url: string
    token?: string
    namespace?: string
    method: string
    body?: Record<string, unknown> | string
}) => {
    return apAxios.request({
        url,
        method,
        headers: {
            ...(token && { 'Authorization': `Token token="${token}"` }),
            ...(typeof body === 'string' && { 'Content-Type': 'text/plain' }),
        },
        data: body,
        responseType: typeof body === 'string' ? 'text' : 'json',
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        })
    })
}