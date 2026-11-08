import { McpOAuthClientKey } from '@activepieces/shared'

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']
const CURSOR_LOOPBACK_PORT = '8787'
const VSCODE_LOOPBACK_PORT = '33418'
const CLINE_LOOPBACK_PORTS = ['1456', '1457', '1458', '1459', '1460', '1461']
const DEVIN_CLI_LOOPBACK_PORT = '8765'
const CODEX_CALLBACK_PATH = /^\/callback\/[^/]+$/
const GEMINI_CLI_CALLBACK_PATH = '/oauth/callback'
const MCP_OAUTH_CALLBACK_PATH = '/mcp/oauth/callback'
const GOOSE_CALLBACK_PATH = '/oauth_callback'

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
    if (host === 'antigravity.google') {
        return 'antigravity'
    }
    if (loopback && url.pathname === MCP_OAUTH_CALLBACK_PATH && CLINE_LOOPBACK_PORTS.includes(url.port)) {
        return 'cline'
    }
    if (loopback && CODEX_CALLBACK_PATH.test(url.pathname)) {
        return 'codex'
    }
    if (loopback && url.pathname === MCP_OAUTH_CALLBACK_PATH) {
        return 'opencode'
    }
    if (loopback && url.pathname === GEMINI_CLI_CALLBACK_PATH) {
        return 'gemini-cli'
    }
    if (loopback && url.pathname === GOOSE_CALLBACK_PATH) {
        return 'goose'
    }
    if (loopback && url.pathname === '/callback' && url.port === DEVIN_CLI_LOOPBACK_PORT) {
        return 'windsurf'
    }
    if (host === 'localhost' && url.pathname === '/callback') {
        return 'claude-code'
    }
    if (scheme === 'windsurf:') {
        return 'windsurf'
    }
    return null
}

export const mcpOAuthClientIdentity = {
    detectClientKey({ redirectUris }: DetectClientKeyParams): McpOAuthClientKey {
        const urls = redirectUris
            .map(parseRedirectUri)
            .filter((url): url is URL => url !== null)
        return urls
            .map(clientKeyFromUrl)
            .find((candidate) => candidate !== null) ?? (isCopilotCli(urls) ? 'copilot-cli' : 'unknown')
    },
}

function isCopilotCli(urls: URL[]): boolean {
    const paths = urls.filter((url) => url.hostname === '127.0.0.1').map((url) => url.pathname)
    return ['/', '/callback'].every((path) => paths.includes(path))
}

type DetectClientKeyParams = {
    redirectUris: string[]
}
