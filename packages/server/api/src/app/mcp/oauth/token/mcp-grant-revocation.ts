import { isNil, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { mcpOAuthRevocationList } from './mcp-oauth-revocation-list'
import { McpOAuthTokenEntity } from './mcp-oauth-token.entity'

const repo = repoFactory(McpOAuthTokenEntity)

export const mcpGrantRevocation = {
    async revokeGrantIds({ grantIds }: RevokeGrantIdsParams): Promise<void> {
        if (grantIds.length === 0) {
            return
        }
        await repo().update({ id: In(grantIds) }, { revoked: true })
        await mcpOAuthRevocationList.revoke({ grantIds })
    },
    async revokeActiveGrants({ scope, log }: RevokeActiveGrantsParams): Promise<void> {
        const { error } = await tryCatch(async () => {
            const grants = await repo().find({ where: { ...scope, revoked: false }, select: { id: true } })
            await mcpGrantRevocation.revokeGrantIds({ grantIds: grants.map((grant) => grant.id) })
        })
        if (!isNil(error)) {
            log.error({ error, platform: { id: scope.platformId } }, 'Could not revoke MCP grants')
        }
    },
}

type RevokeGrantIdsParams = {
    grantIds: string[]
}

type RevokeActiveGrantsParams = {
    scope: { platformId: string } & ({ userId: string } | { projectId: string })
    log: FastifyBaseLogger
}
