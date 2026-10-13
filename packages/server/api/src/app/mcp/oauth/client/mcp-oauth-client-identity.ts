import { McpOAuthClientKey } from '@activepieces/shared'

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']
const CURSOR_LOOPBACK_PORT = '8787'
const VSCODE_LOOPBACK_PORT = '33418'
const CODEX_CALLBACK_PATH = /^\/callback\/[^/]+$/
const GEMINI_CLI_CALLBACK_PATH = '/oauth/callback'
const OPENCODE_CALLBACK_PATH = '/mcp/oauth/callback'

function parseRedirectUri(redirectUri: string): URL | null {
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

function clientKeyFromUrl(url: URL): McpOAuthClientKey | null {
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
    if (loopback && url.pathname === OPENCODE_CALLBACK_PATH) {
        return 'opencode'
    }
    if (loopback && url.pathname === GEMINI_CLI_CALLBACK_PATH) {
        return 'gemini-cli'
    }
    if (loopback && url.pathname === '/callback') {
        return 'claude-code'
    }
    if (scheme === 'windsurf:') {
        return 'windsurf'
    }
    return null
}

export const mcpOAuthClientIdentity = {
    detectClientKey({ redirectUris }: DetectClientKeyParams): McpOAuthClientKey {
        return redirectUris
            .map(parseRedirectUri)
            .filter((url): url is URL => url !== null)
            .map(clientKeyFromUrl)
            .find((candidate) => candidate !== null) ?? 'unknown'
    },
}

type DetectClientKeyParams = {
    redirectUris: string[]
}
