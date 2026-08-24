import { describe, expect, it } from 'vitest'
import { mcpOAuthClientIdentity } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client-identity'

function clientKeyFrom(redirectUris: string[]) {
    return mcpOAuthClientIdentity.clientKeyFrom({ redirectUris })
}

describe('mcpOAuthClientIdentity.clientKeyFrom', () => {
    it('identifies remote-dialing web clients by host', () => {
        expect(clientKeyFrom(['https://claude.ai/api/mcp/auth_callback'])).toBe('claude')
        expect(clientKeyFrom(['https://chatgpt.com/connector_platform_oauth_redirect'])).toBe('chatgpt')
        expect(clientKeyFrom(['https://www.cursor.com/api/auth/mcp/callback'])).toBe('cursor')
        expect(clientKeyFrom(['https://vscode.dev/redirect'])).toBe('vscode')
    })

    it('identifies editors by their private-use scheme', () => {
        expect(clientKeyFrom(['cursor://anysphere.cursor-retrieval/oauth/callback'])).toBe('cursor')
        expect(clientKeyFrom(['vscode://mcp/callback'])).toBe('vscode')
        expect(clientKeyFrom(['vscode-insiders://mcp/callback'])).toBe('vscode')
        expect(clientKeyFrom(['windsurf://mcp/callback'])).toBe('windsurf')
    })

    it('identifies editors by their reserved loopback port', () => {
        expect(clientKeyFrom(['http://127.0.0.1:8787/callback'])).toBe('cursor')
        expect(clientKeyFrom(['http://localhost:33418/callback'])).toBe('vscode')
    })

    it('separates the two CLIs by their loopback callback path', () => {
        expect(clientKeyFrom(['http://localhost:1455/callback/abc123'])).toBe('codex')
        expect(clientKeyFrom(['http://localhost:54545/callback'])).toBe('claude-code')
        expect(clientKeyFrom(['http://127.0.0.1:9999/callback'])).toBe('claude-code')
    })

    it('never hides an unmatched grant, and never trusts clientName as a signal', () => {
        expect(clientKeyFrom(['https://example.com/oauth/callback'])).toBe('unknown')
        expect(clientKeyFrom([])).toBe('unknown')
        expect(clientKeyFrom(['not a url'])).toBe('unknown')
    })
})
