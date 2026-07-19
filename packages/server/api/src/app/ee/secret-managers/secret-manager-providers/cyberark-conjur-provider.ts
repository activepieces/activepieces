import { safeHttp } from '@activepieces/server-utils'
import { CyberarkConjurProviderConfig, SecretManagerProviderId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider, throwConnectionError, throwGetSecretError } from './secret-manager-providers'

// Build the Conjur HTTP client per connection so TLS certificate verification
// honours that connection's config. Verification is now ON by default; it was
// previously hardcoded OFF (`rejectUnauthorized: false`), so the certificate was
// never validated on either the authentication call (which carries the Conjur
// API key) or secret retrieval. Internal / self-signed deployments should pin
// their CA via `caCert` (keeps verification ON); `allowUnauthorizedCertificates`
// is an explicit, last-resort opt-out.
const createConjurAxios = (config: CyberarkConjurProviderConfig) =>
    safeHttp.createRetryingAxios(undefined, {
        httpsAgentOptions: {
            rejectUnauthorized: !(config.allowUnauthorizedCertificates ?? false),
            ...(config.caCert ? { ca: config.caCert } : {}),
        },
    })

export const cyberarkConjurProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.CYBERARK> => ({
    checkConnection: async (config) => {
        const conjurAxios = createConjurAxios(config)
        const url = removeEndingSlash(config.url)
        const response = await conjurApi({
            conjurAxios,
            url: `${url}/authn/${config.organizationAccountName}/${encodeURIComponent(config.loginId)}/authenticate`,
            method: 'POST',
            body: config.apiKey,
        }).catch((error) => {
            throwConnectionError({ error, provider: SecretManagerProviderId.CYBERARK, log })
        })
        const token = response.data
        if (!token) {
            throwConnectionError({ error: 'No token received', provider: SecretManagerProviderId.CYBERARK, log })
        }
        return Buffer.from(String(token).trim(), 'utf8').toString('base64')
    },
    connect: async (config) => {
        await cyberarkConjurProvider(log).checkConnection(config)
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (request, config) => {

        const token = await cyberarkConjurProvider(log).checkConnection(config) as string
        const conjurAxios = createConjurAxios(config)
        const url = removeEndingSlash(config.url)
        const response = await conjurApi({
            conjurAxios,
            url: `${url}/secrets/${config.organizationAccountName}/variable/${encodeURIComponent(request.path)}`,
            token,
            method: 'GET',
        }).catch((error) => {
            throwGetSecretError({ error, path: request.path, provider: SecretManagerProviderId.CYBERARK, request, log })
        })
        const data = response.data

        if (!data) {
            throwGetSecretError({ error: 'No secret found at requested path', path: request.path, provider: SecretManagerProviderId.CYBERARK, request, log })
        }
        return data
    },
})

const removeEndingSlash = (path: string) => {
    return path.endsWith('/') ? path.slice(0, -1) : path
}

const conjurApi = async ({
    conjurAxios,
    url,
    token,
    method,
    body,
}: {
    conjurAxios: ReturnType<typeof safeHttp.createRetryingAxios>
    url: string
    token?: string
    namespace?: string
    method: string
    body?: Record<string, unknown> | string
}) => {
    return conjurAxios.request({
        url,
        method,
        headers: {
            ...(token && { 'Authorization': `Token token="${token}"` }),
            ...(typeof body === 'string' && { 'Content-Type': 'text/plain' }),
        },
        data: body,
        responseType: typeof body === 'string' ? 'text' : 'json',
    })
}
