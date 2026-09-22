import { ActivepiecesError, ErrorCode, isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'

const REQUEST_TIMEOUT_MS = 10_000

async function discoverAndRegister({ serverUrl, redirectUrl }: DiscoverAndRegisterParams): Promise<DiscoveredOAuth2Client> {
    const authorizationServer = await resolveAuthorizationServer(serverUrl)
    const metadata = await fetchAuthorizationServerMetadata(authorizationServer)

    if (isNil(metadata.registration_endpoint)) {
        throw invalidConnection(`${authorizationServer} does not support Dynamic Client Registration (no registration_endpoint in its metadata). Provide a Client ID and Client Secret from the server's own documentation instead.`)
    }

    const client = await registerClient({
        registrationEndpoint: metadata.registration_endpoint,
        redirectUrl,
        scope: (metadata.scopes_supported ?? []).join(' '),
    })

    if (isNil(client.client_secret) || client.client_secret.length === 0) {
        throw invalidConnection(`${authorizationServer} issues public OAuth2 clients (no client secret), which is not supported yet. Provide a Client ID and Client Secret manually instead.`)
    }

    return {
        authUrl: withResourceIndicator({ authorizationEndpoint: metadata.authorization_endpoint, serverUrl }),
        tokenUrl: metadata.token_endpoint,
        scopes: (metadata.scopes_supported ?? []).join(' '),
        clientId: client.client_id,
        clientSecret: client.client_secret,
    }
}

// An MCP server that skips RFC 9728 is its own authorization server.
async function resolveAuthorizationServer(serverUrl: string): Promise<string> {
    const url = parseServerUrl(serverUrl)
    const resourcePath = url.pathname === '/' ? '' : url.pathname
    const metadata = await fetchFirst<ProtectedResourceMetadata>([
        `${url.origin}/.well-known/oauth-protected-resource${resourcePath}`,
        `${url.origin}/.well-known/oauth-protected-resource`,
    ])
    return metadata?.authorization_servers?.[0] ?? url.origin
}

async function fetchAuthorizationServerMetadata(authorizationServer: string): Promise<AuthorizationServerMetadata> {
    // ponytail: assumes the issuer has no path component, true of every deployment seen
    // so far; RFC 8414 also allows inserting that path before the well-known suffix.
    const origin = authorizationServer.replace(/\/$/, '')
    const candidates = [
        `${origin}/.well-known/oauth-authorization-server`,
        `${origin}/.well-known/openid-configuration`,
    ]
    const metadata = await fetchFirst<AuthorizationServerMetadata>(candidates)
    if (isNil(metadata) || isNil(metadata.authorization_endpoint) || isNil(metadata.token_endpoint)) {
        throw invalidConnection(`Could not discover OAuth2 endpoints for ${authorizationServer}. Tried ${candidates.join(' and ')}. If this server is on a private network, add its host to AP_SSRF_ALLOW_LIST.`)
    }
    return metadata
}

async function fetchFirst<T>(candidates: string[]): Promise<T | null> {
    for (const url of candidates) {
        const { data: response, error } = await tryCatch(() => safeHttp.axios.get<T>(url, { timeout: REQUEST_TIMEOUT_MS }))
        if (isNil(error) && !isNil(response)) {
            return response.data
        }
    }
    return null
}

async function registerClient({ registrationEndpoint, redirectUrl, scope }: RegisterClientParams): Promise<ClientRegistrationResponse> {
    const { data: response, error } = await tryCatch(() => safeHttp.axios.post<ClientRegistrationResponse>(registrationEndpoint, {
        client_name: 'Activepieces',
        redirect_uris: [redirectUrl],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic',
        ...(scope.length > 0 ? { scope } : {}),
    }, {
        headers: { 'content-type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
    }))
    if (!isNil(error) || isNil(response)) {
        throw invalidConnection(`Dynamic Client Registration failed at ${registrationEndpoint}: ${error instanceof Error ? error.message : String(error)}`)
    }
    return response.data
}

function withResourceIndicator({ authorizationEndpoint, serverUrl }: WithResourceIndicatorParams): string {
    const url = new URL(authorizationEndpoint)
    url.searchParams.set('resource', canonicalResourceUri(serverUrl))
    return url.toString()
}

function canonicalResourceUri(serverUrl: string): string {
    const url = parseServerUrl(serverUrl)
    return `${url.origin}${url.pathname}`.replace(/\/$/, '')
}

function parseServerUrl(serverUrl: string): URL {
    const { data: url, error } = tryCatchSync(() => new URL(serverUrl))
    if (!isNil(error) || isNil(url)) {
        throw invalidConnection(`"${serverUrl}" is not a valid server URL.`)
    }
    return url
}

function invalidConnection(error: string): ActivepiecesError {
    return new ActivepiecesError({
        code: ErrorCode.INVALID_APP_CONNECTION,
        params: { error },
    })
}

export const oauth2Discovery = { discoverAndRegister }

type DiscoverAndRegisterParams = {
    serverUrl: string
    redirectUrl: string
}

type RegisterClientParams = {
    registrationEndpoint: string
    redirectUrl: string
    scope: string
}

type WithResourceIndicatorParams = {
    authorizationEndpoint: string
    serverUrl: string
}

export type DiscoveredOAuth2Client = {
    authUrl: string
    tokenUrl: string
    scopes: string
    clientId: string
    clientSecret: string
}

type ProtectedResourceMetadata = {
    authorization_servers?: string[]
}

type AuthorizationServerMetadata = {
    authorization_endpoint: string
    token_endpoint: string
    registration_endpoint?: string
    scopes_supported?: string[]
}

type ClientRegistrationResponse = {
    client_id: string
    client_secret?: string
}
