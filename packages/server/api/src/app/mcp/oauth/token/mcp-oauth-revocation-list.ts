import { getMcpOAuthRevokedGrantKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { MCP_OAUTH_REVOKED_GRANT_TTL_SECONDS } from './mcp-oauth-token-lifetimes'

export const mcpOAuthRevocationList = {
    async revoke({ grantIds }: RevokeParams): Promise<void> {
        const entries = grantIds.map((grantId) => ({ key: getMcpOAuthRevokedGrantKey(grantId), value: true }))
        await distributedStore.putBatch(entries, MCP_OAUTH_REVOKED_GRANT_TTL_SECONDS)
    },

    async isRevoked({ grantId }: IsRevokedParams): Promise<boolean> {
        const revoked = await distributedStore.get<boolean>(getMcpOAuthRevokedGrantKey(grantId))
        return revoked === true
    },
}

type RevokeParams = {
    grantIds: string[]
}

type IsRevokedParams = {
    grantId: string
}
