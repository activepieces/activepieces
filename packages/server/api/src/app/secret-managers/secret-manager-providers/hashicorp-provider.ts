import { apAxios } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, HashicorpGetSecretRequest, HashicorpProviderConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'

export const HASHICORP_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.HASHICORP,
    name: 'Hashicorp Vault',
    logo: 'https://icon.icepanel.io/Technology/svg/HashiCorp-Vault.svg',
    fields: {
        url: {
            displayName: 'URL',
            placeholder: 'http://localhost:8200',
        },
        token: {
            displayName: 'Token',
            placeholder: 'token',
        },
    },
    getSecretParams: {
        path: {
            displayName: 'Secret Path',
            placeholder: 'eg: secret/data/keys/my-key',
        },
    },
}

export const hashicorpProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.HASHICORP> => ({
    checkConnection: async (config) => {
        await vaultApi({
            url: `${config.url}/v1/sys/mounts`,
            token: config.token,
            method: 'GET',
        }).catch((error) => {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message: error.message,
                    provider: SecretManagerProviderId.HASHICORP,
                },
            })
        })
        return true
    },
    connect: async (config) => {
        await hashicorpProvider(log).checkConnection(config)
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (request: HashicorpGetSecretRequest, config: HashicorpProviderConfig) => {

        const pathParts = request.path.split('/')
        const mountPath = pathParts.slice(0, -1).join('/')
        const secretKey = pathParts.slice(-1)[0]

        const response = await vaultApi({
            url: `${config.url}/v1/${mountPath}`,
            token: config.token,
            method: 'GET',
        }).catch((error) => {
            log.error({
                message: error.message,
                provider: SecretManagerProviderId.HASHICORP,
                request,
            }, '[hashicorpProvider#getSecret]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: error.message,
                    provider: SecretManagerProviderId.HASHICORP,
                    request,
                },
            })
        })
        const data = response.data?.data?.data
        if (!data || !data[secretKey]) {
            log.error({
                message: 'No secret found at requested path',
                provider: SecretManagerProviderId.HASHICORP,
                request,
            }, '[hashicorpProvider#getSecret]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message: 'No secret found at requested path',
                    provider: SecretManagerProviderId.HASHICORP,
                    request,
                },
            })
        }
        return data[secretKey]
    },
    resolve: async (key: string) => {
        const splits = key.split(':')
        if (splits.length < 2) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Wrong key format . should be providerName:mount/data/path/key',
                },
            })
        }
        const path = removeEndingSlash(splits[1])
        const pathParts = path.split('/')
        if (pathParts.length < 3) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Wrong path format . should be mount/data/path/key',
                },
            })
        }
        return {
            path,
        }
    },
})

const removeEndingSlash = (path: string) => {
    return path.endsWith('/') ? path.slice(0, -1) : path
}

const vaultApi = async ({
    url,
    token,
    method,
    body,
}: {
    url: string
    token: string
    method: string
    body?: Record<string, unknown>
}) => {
    return apAxios.request({
        url,
        method,
        headers: {
            'X-Vault-Token': token,
            'X-Vault-Request': 'true',
        },
        data: body,
    })
}