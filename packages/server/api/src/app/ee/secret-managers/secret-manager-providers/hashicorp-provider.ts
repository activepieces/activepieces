import { SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/ee-shared'
import { apAxios } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'

export const HASHICORP_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.HASHICORP,
    name: 'Hashicorp Vault',
    logo: 'https://cdn.activepieces.com/pieces/hashi-corp-vault.png',
    fields: {
        url: {
            displayName: 'URL',
            placeholder: 'http://localhost:8200',
            type: 'text',
        },
        namespace: {
            displayName: 'Namespace',
            placeholder: 'namespace',
            optional: true,
            type: 'text',
        },
        roleId: {
            displayName: 'Role ID',
            placeholder: 'role-id',
            type: 'password',
        },
        secretId: {
            displayName: 'Secret ID',
            placeholder: 'secret-id',
            type: 'password',
        },
    },
    secretParams: {
        path: {
            displayName: 'Secret Path',
            placeholder: 'eg: secret/data/keys/my-key',
            type: 'text',
        },
    },
}

export const hashicorpProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.HASHICORP> => ({
    checkConnection: async (config) => {
        const url = removeEndingSlash(config.url)
        const response = await vaultApi({
            url: `${url}/v1/auth/approle/login`,
            method: 'POST',
            body: {
                role_id: config.roleId,
                secret_id: config.secretId,
            },
            namespace: config.namespace,
        }).catch((error) => {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message: error.message,
                    provider: SecretManagerProviderId.HASHICORP,
                },
            })
        })
        const token = response.data?.auth?.client_token
        if (!token) {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message: 'No token received',
                    provider: SecretManagerProviderId.HASHICORP,
                },
            })
        }
        await vaultApi({
            url: `${url}/v1/sys/mounts`,
            token,
            method: 'GET',
            namespace: config.namespace,
        }).catch((error) => {
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message: 'Permission denied. make sure the app role policies has the necessary permissions ' + error.message,
                    provider: SecretManagerProviderId.HASHICORP,
                },
            })
        })
        return token
    },
    connect: async (config) => {
        await hashicorpProvider(log).checkConnection(config)
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (request, config) => {
        await validatePathFormat(request.path)
        const pathParts = request.path.split('/')
        const mountPath = pathParts.slice(0, -1).join('/')
        const secretKey = pathParts.slice(-1)[0]
        const token = await hashicorpProvider(log).checkConnection(config) as string
        const configUrl = removeEndingSlash(config.url)
        const requestUrl = `${configUrl}/v1/${mountPath}`
        const response = await vaultApi({
            url: requestUrl,
            token,
            method: 'GET',
            namespace: config.namespace,
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
                    request: { ...request, url: requestUrl },
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
})

function validatePathFormat(key: string) {
    const path = removeEndingSlash(key)
    const pathParts = path.split('/')
    if (pathParts.length < 3 ) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Wrong path format . should be mount/data/path/key. got ' + key,
            },
        })
    }
}

const removeEndingSlash = (path: string) => {
    return path.endsWith('/') ? path.slice(0, -1) : path
}

const vaultApi = async ({
    url,
    token,
    method,
    body,
    namespace,
}: {
    url: string
    token?: string
    namespace?: string
    method: string
    body?: Record<string, unknown>
}) => {
    return apAxios.request({
        url,
        method,
        headers: {
            ...(token && { 'X-Vault-Token': token, 'X-Vault-Request': 'true' }),
            ...(namespace && { 'X-Vault-Namespace': namespace }),
        },
        data: body,
    })
}