import https from 'https'
import { CyberarkConjurGetSecretRequest, CyberarkConjurProviderConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/ee-shared'
import { apAxios } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'

export const CYBERARK_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.CYBERARK,
    name: 'Cyberark Conjur',
    logo: 'https://cdn.activepieces.com/pieces/cyberark.png',
    fields: {
        url: {
            displayName: 'URL',
            placeholder: 'https://conjur.example.com',
            type: 'text',
        },
        organizationAccountName: {
            displayName: 'Organization Account Name',
            placeholder: 'Your Conjur Organization Account Name',
            type: 'text',
        },
        loginId: {
            displayName: 'Login ID',
            placeholder: 'Your Conjur Login ID',
            type: 'text',
        },
        apiKey: {
            displayName: 'API Key',
            placeholder: 'Your Conjur API Key',
            type: 'password',
        },
    },
    getSecretParams: {
        secretKey: {
            displayName: 'Secret key',
            placeholder: 'Your Conjur Secret Key',
            type: 'text',
        },
    },
}

export const cyberarkConjurProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.CYBERARK> => ({
    checkConnection: async (config) => {
        const url = removeEndingSlash(config.url)
        const response = await conjurApi({
            url: `${url}/authn/${config.organizationAccountName}/${encodeURIComponent(config.loginId)}/authenticate`,
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
        const url = removeEndingSlash(config.url)

        const response = await conjurApi({
            url: `${url}/secrets/${config.organizationAccountName}/variable/${encodeURIComponent(request.secretKey)}`,
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

const removeEndingSlash = (path: string) => {
    return path.endsWith('/') ? path.slice(0, -1) : path
}

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
        }),
    })
}
