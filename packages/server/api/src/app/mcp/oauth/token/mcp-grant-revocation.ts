import { isNil, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { McpOAuthAuthorizationCodeEntity } from '../code/mcp-oauth-code.entity'
import { mcpOAuthRevocationList } from './mcp-oauth-revocation-list'
import { McpOAuthTokenEntity } from './mcp-oauth-token.entity'

const repo = repoFactory(McpOAuthTokenEntity)
const codeRepo = repoFactory(McpOAuthAuthorizationCodeEntity)

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
            const grantIds = await transaction(async (entityManager) => {
                await codeRepo(entityManager).update({ ...scope, used: false }, { used: true })
                const grants = await repo(entityManager).find({ where: { ...scope, revoked: false }, select: { id: true } })
                const ids = grants.map((grant) => grant.id)
                if (ids.length > 0) {
                    await repo(entityManager).update({ id: In(ids) }, { revoked: true })
                }
                return ids
            })
            if (grantIds.length > 0) {
                await mcpOAuthRevocationList.revoke({ grantIds })
            }
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
