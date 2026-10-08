import { describe, expect, it } from 'vitest'
import { mcpOAuthClientIdentity } from '../../../../../../src/app/mcp/oauth/client/mcp-oauth-client-identity'

function detectClientKey(redirectUris: string[]) {
    return mcpOAuthClientIdentity.detectClientKey({ redirectUris })
}

describe('mcpOAuthClientIdentity.detectClientKey', () => {
    it('identifies remote-dialing web clients by host', () => {
        expect(detectClientKey(['https://claude.ai/api/mcp/auth_callback'])).toBe('claude')
        expect(detectClientKey(['https://chatgpt.com/connector_platform_oauth_redirect'])).toBe('chatgpt')
        expect(detectClientKey(['https://www.cursor.com/api/auth/mcp/callback'])).toBe('cursor')
        expect(detectClientKey(['https://vscode.dev/redirect'])).toBe('vscode')
    })

    it('identifies editors by their private-use scheme', () => {
        expect(detectClientKey(['cursor://anysphere.cursor-retrieval/oauth/callback'])).toBe('cursor')
        expect(detectClientKey(['vscode://mcp/callback'])).toBe('vscode')
        expect(detectClientKey(['vscode-insiders://mcp/callback'])).toBe('vscode')
        expect(detectClientKey(['windsurf://mcp/callback'])).toBe('windsurf')
    })

    it('identifies editors by their reserved loopback port', () => {
        expect(detectClientKey(['http://127.0.0.1:8787/callback'])).toBe('cursor')
        expect(detectClientKey(['http://localhost:33418/callback'])).toBe('vscode')
    })

    it('separates the CLIs by their loopback callback path', () => {
        expect(detectClientKey(['http://localhost:1455/callback/abc123'])).toBe('codex')
        expect(detectClientKey(['http://localhost:54545/callback'])).toBe('claude-code')
        expect(detectClientKey(['http://127.0.0.1:9999/callback'])).toBe('claude-code')
        expect(detectClientKey(['http://localhost:41337/oauth/callback'])).toBe('gemini-cli')
        expect(detectClientKey(['http://127.0.0.1:19876/mcp/oauth/callback'])).toBe('opencode')
    })

    it('never hides an unmatched grant, and never trusts clientName as a signal', () => {
        expect(detectClientKey(['https://example.com/oauth/callback'])).toBe('unknown')
        expect(detectClientKey([])).toBe('unknown')
        expect(detectClientKey(['not a url'])).toBe('unknown')
    })
})
