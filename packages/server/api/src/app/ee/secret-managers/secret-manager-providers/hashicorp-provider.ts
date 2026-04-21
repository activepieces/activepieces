import { ActivepiecesError, ErrorCode, SecretManagerProviderId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAxios } from '../../../helper/ap-axios'
import { SecretManagerProvider, throwConnectionError, throwGetSecretError } from './secret-manager-providers'

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
            throwConnectionError({ error, provider: SecretManagerProviderId.HASHICORP, log })
        })
        const token = response.data?.auth?.client_token
        if (!token) {
            throwConnectionError({ error: 'No token received', provider: SecretManagerProviderId.HASHICORP, log })
        }
        await vaultApi({
            url: `${url}/v1/sys/mounts`,
            token,
            method: 'GET',
            namespace: config.namespace,
        }).catch((error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throwConnectionError({ error: `Permission denied. make sure the app role policies has the necessary permissions ${errorMessage}`, provider: SecretManagerProviderId.HASHICORP, log })
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
            throwGetSecretError({ error, path: request.path, provider: SecretManagerProviderId.HASHICORP, request: { ...request, url: requestUrl }, log })
        })
        const data = response.data?.data?.data
        if (!data || !data[secretKey]) {
            throwGetSecretError({ error: 'No secret found at requested path', path: request.path, provider: SecretManagerProviderId.HASHICORP, request, log })
        }
        return data[secretKey]
    },
})

export async function validatePathFormat(key: string) {
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