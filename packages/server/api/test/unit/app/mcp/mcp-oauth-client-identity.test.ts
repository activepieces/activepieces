import { describe, expect, it } from 'vitest'
import { mcpOAuthClientIdentity } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client-identity'

function classify(redirectUris: string[]) {
    return mcpOAuthClientIdentity.classify({ redirectUris })
}

describe('mcpOAuthClientIdentity.classify', () => {
    it('identifies remote-dialing web clients by host', () => {
        expect(classify(['https://claude.ai/api/mcp/auth_callback'])).toEqual({ key: 'claude', connectsFrom: 'remote' })
        expect(classify(['https://chatgpt.com/connector_platform_oauth_redirect'])).toEqual({ key: 'chatgpt', connectsFrom: 'remote' })
        expect(classify(['https://www.cursor.com/api/auth/mcp/callback'])).toEqual({ key: 'cursor', connectsFrom: 'remote' })
        expect(classify(['https://vscode.dev/redirect'])).toEqual({ key: 'vscode', connectsFrom: 'remote' })
    })

    it('identifies editors by their private-use scheme', () => {
        expect(classify(['cursor://anysphere.cursor-retrieval/oauth/callback'])).toEqual({ key: 'cursor', connectsFrom: 'local' })
        expect(classify(['vscode://mcp/callback'])).toEqual({ key: 'vscode', connectsFrom: 'local' })
        expect(classify(['vscode-insiders://mcp/callback'])).toEqual({ key: 'vscode', connectsFrom: 'local' })
        expect(classify(['windsurf://mcp/callback'])).toEqual({ key: 'windsurf', connectsFrom: 'local' })
    })

    it('identifies editors by their reserved loopback port', () => {
        expect(classify(['http://127.0.0.1:8787/callback'])).toEqual({ key: 'cursor', connectsFrom: 'local' })
        expect(classify(['http://localhost:33418/callback'])).toEqual({ key: 'vscode', connectsFrom: 'local' })
    })

    it('separates the two CLIs by their loopback callback path', () => {
        expect(classify(['http://localhost:1455/callback/abc123'])).toEqual({ key: 'codex', connectsFrom: 'local' })
        expect(classify(['http://localhost:54545/callback'])).toEqual({ key: 'claude-code', connectsFrom: 'local' })
        expect(classify(['http://127.0.0.1:9999/callback'])).toEqual({ key: 'claude-code', connectsFrom: 'local' })
    })

    it('never hides an unmatched grant, and never trusts clientName as a signal', () => {
        expect(classify(['https://example.com/oauth/callback'])).toEqual({ key: 'unknown', connectsFrom: 'remote' })
        expect(classify([])).toEqual({ key: 'unknown', connectsFrom: 'remote' })
        expect(classify(['not a url'])).toEqual({ key: 'unknown', connectsFrom: 'remote' })
    })

    it('reads a redirect URI as local when the host is loopback or private', () => {
        expect(classify(['http://localhost:3000/x'])).toEqual({ key: 'unknown', connectsFrom: 'local' })
        expect(classify(['http://192.168.1.10:3000/x'])).toEqual({ key: 'unknown', connectsFrom: 'local' })
        expect(classify(['myeditor://cb'])).toEqual({ key: 'unknown', connectsFrom: 'local' })
    })
})
