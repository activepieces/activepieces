import { describe, expect, it } from 'vitest'
import { getMcpOAuthRevokedGrantKey } from '../../../../../../src/app/database/redis/keys'
import { MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS, MCP_OAUTH_REVOKED_GRANT_TTL_SECONDS } from '../../../../../../src/app/mcp/oauth/token/mcp-oauth-token-lifetimes'

describe('MCP OAuth revocation list', () => {
    it('namespaces a revoked grant under its own id', () => {
        expect(getMcpOAuthRevokedGrantKey('9SzBEyRXJP')).toBe('mcp_oauth:revoked_grant:9SzBEyRXJP')
    })

    it('outlives every access token the grant could have issued', () => {
        expect(MCP_OAUTH_REVOKED_GRANT_TTL_SECONDS).toBeGreaterThan(MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS)
        expect(MCP_OAUTH_REVOKED_GRANT_TTL_SECONDS).toBe(MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS + 60)
    })
})
