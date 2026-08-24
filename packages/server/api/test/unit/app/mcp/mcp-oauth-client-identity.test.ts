import { describe, expect, it } from 'vitest'
import { mcpOAuthClientIdentity } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client-identity'

function classify(redirectUris: string[]) {
    return mcpOAuthClientIdentity.classify({ redirectUris })
}

describe('mcpOAuthClientIdentity.classify', () => {
    it('identifies remote-dialing web clients by host', () => {
        expect(classify(['https://claude.ai/api/mcp/auth_callback'])).toBe('claude')
        expect(classify(['https://chatgpt.com/connector_platform_oauth_redirect'])).toBe('chatgpt')
        expect(classify(['https://www.cursor.com/api/auth/mcp/callback'])).toBe('cursor')
        expect(classify(['https://vscode.dev/redirect'])).toBe('vscode')
    })

    it('identifies editors by their private-use scheme', () => {
        expect(classify(['cursor://anysphere.cursor-retrieval/oauth/callback'])).toBe('cursor')
        expect(classify(['vscode://mcp/callback'])).toBe('vscode')
        expect(classify(['vscode-insiders://mcp/callback'])).toBe('vscode')
        expect(classify(['windsurf://mcp/callback'])).toBe('windsurf')
    })

    it('identifies editors by their reserved loopback port', () => {
        expect(classify(['http://127.0.0.1:8787/callback'])).toBe('cursor')
        expect(classify(['http://localhost:33418/callback'])).toBe('vscode')
    })

    it('separates the two CLIs by their loopback callback path', () => {
        expect(classify(['http://localhost:1455/callback/abc123'])).toBe('codex')
        expect(classify(['http://localhost:54545/callback'])).toBe('claude-code')
        expect(classify(['http://127.0.0.1:9999/callback'])).toBe('claude-code')
    })

    it('never hides an unmatched grant, and never trusts clientName as a signal', () => {
        expect(classify(['https://example.com/oauth/callback'])).toBe('unknown')
        expect(classify([])).toBe('unknown')
        expect(classify(['not a url'])).toBe('unknown')
    })
})
