import { isNil, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, FindOperator, In, MoreThan } from 'typeorm'
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
            const grantIds = await transaction((entityManager) => markActiveGrantsRevoked({ scope, entityManager }))
            if (grantIds.length > 0) {
                await mcpOAuthRevocationList.revoke({ grantIds })
            }
        })
        if (!isNil(error)) {
            log.error({ error, platform: { id: scope.platformId } }, 'Could not revoke MCP grants')
        }
    },
    async revokeUsersActiveGrantsInTransaction({ platformId, userIds, entityManager }: RevokeUsersActiveGrantsInTransactionParams): Promise<string[]> {
        if (userIds.length === 0) {
            return []
        }
        return markActiveGrantsRevoked({ scope: { platformId, userId: In(userIds) }, entityManager })
    },
    async blockRevokedGrants({ grantIds, platformId, log }: BlockRevokedGrantsParams): Promise<void> {
        if (grantIds.length === 0) {
            return
        }
        const { error } = await tryCatch(() => mcpOAuthRevocationList.revoke({ grantIds }))
        if (!isNil(error)) {
            log.error({ error, platform: { id: platformId } }, 'Could not revoke MCP grants')
        }
    },
}

async function markActiveGrantsRevoked({ scope, entityManager }: MarkActiveGrantsRevokedParams): Promise<string[]> {
    await codeRepo(entityManager).update({ ...scope, used: false, expiresAt: MoreThan(new Date().toISOString()) }, { used: true })
    const grants = await repo(entityManager).find({ where: { ...scope, revoked: false }, select: { id: true } })
    const ids = grants.map((grant) => grant.id)
    if (ids.length > 0) {
        await repo(entityManager).update({ id: In(ids) }, { revoked: true })
    }
    return ids
}

type RevokeGrantIdsParams = {
    grantIds: string[]
}

type RevokeActiveGrantsParams = {
    scope: { platformId: string } & ({ userId: string } | { projectId: string })
    log: FastifyBaseLogger
}

type RevokeUsersActiveGrantsInTransactionParams = {
    platformId: string
    userIds: string[]
    entityManager: EntityManager
}

type BlockRevokedGrantsParams = {
    grantIds: string[]
    platformId: string
    log: FastifyBaseLogger
}

type MarkActiveGrantsRevokedParams = {
    scope: { platformId: string } & ({ userId: string | FindOperator<string> } | { projectId: string })
    entityManager: EntityManager
}
