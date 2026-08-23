import { McpOAuthClientConnectsFrom, McpOAuthClientKey } from '@activepieces/shared'

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']
const CURSOR_LOOPBACK_PORT = '8787'
const VSCODE_LOOPBACK_PORT = '33418'
const CODEX_CALLBACK_PATH = /^\/callback\/[^/]+$/

function parse(redirectUri: string): URL | null {
    try {
        return new URL(redirectUri)
    }
    catch {
        return null
    }
}

function isLoopback(url: URL): boolean {
    return LOOPBACK_HOSTS.includes(url.hostname.toLowerCase())
}

function isPrivateHost(url: URL): boolean {
    const host = url.hostname.toLowerCase()
    if (isLoopback(url)) {
        return true
    }
    if (host.endsWith('.local') || host.endsWith('.internal')) {
        return true
    }
    const octets = host.split('.').map(Number)
    if (octets.length !== 4 || octets.some(Number.isNaN)) {
        return false
    }
    const [first, second] = octets
    return first === 10
        || (first === 172 && second >= 16 && second <= 31)
        || (first === 192 && second === 168)
        || (first === 100 && second >= 64 && second <= 127)
}

function classifyOne(url: URL): McpOAuthClientKey | null {
    const host = url.hostname.toLowerCase()
    const scheme = url.protocol.toLowerCase()
    const loopback = isLoopback(url)

    if (host === 'claude.ai') {
        return 'claude'
    }
    if (host === 'chatgpt.com') {
        return 'chatgpt'
    }
    if (host === 'www.cursor.com' || scheme === 'cursor:' || (loopback && url.port === CURSOR_LOOPBACK_PORT)) {
        return 'cursor'
    }
    if (host === 'vscode.dev' || scheme === 'vscode:' || scheme === 'vscode-insiders:' || (loopback && url.port === VSCODE_LOOPBACK_PORT)) {
        return 'vscode'
    }
    if (loopback && CODEX_CALLBACK_PATH.test(url.pathname)) {
        return 'codex'
    }
    if (loopback && url.pathname === '/callback') {
        return 'claude-code'
    }
    if (scheme === 'windsurf:') {
        return 'windsurf'
    }
    return null
}

function connectsFrom(urls: URL[]): McpOAuthClientConnectsFrom {
    const anyRemote = urls.some(url => (url.protocol === 'http:' || url.protocol === 'https:') && !isPrivateHost(url))
    if (urls.length === 0) {
        return 'remote'
    }
    return anyRemote ? 'remote' : 'local'
}

export const mcpOAuthClientIdentity = {
    classify({ redirectUris }: ClassifyParams): McpOAuthClientIdentity {
        const urls = redirectUris.map(parse).filter((url): url is URL => url !== null)
        const key = urls.map(classifyOne).find(candidate => candidate !== null) ?? 'unknown'
        return { key, connectsFrom: connectsFrom(urls) }
    },
}

type ClassifyParams = {
    redirectUris: string[]
}

type McpOAuthClientIdentity = {
    key: McpOAuthClientKey
    connectsFrom: McpOAuthClientConnectsFrom
}
