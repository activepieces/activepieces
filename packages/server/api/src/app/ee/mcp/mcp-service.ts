import { MCP, MCPStatus } from '@activepieces/ee-shared'
import { ActivepiecesError, ApId, apId, ErrorCode } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { MCPEntity } from './mcp-entity'

const repo = repoFactory(MCPEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async getOrCreate({ projectId }: { projectId: ApId }): Promise<MCP> {
        const existingMCP = await repo().findOne({
            where: { projectId },
            relations: ['connections'],
        })

        if (existingMCP) {
            return existingMCP
        }

        const mcpId = apId()
        await repo().createQueryBuilder()
            .insert()
            .into(MCPEntity)
            .values({
                id: mcpId,
                projectId,
                status: MCPStatus.DISABLED,
                created: dayjs().toISOString(),
                updated: dayjs().toISOString(),
            })
            .execute()


        return repo().findOneOrFail({
            where: { id: mcpId },
            relations: ['connections'],
        })
    },

    async updateStatus({ mcpId, status }: { mcpId: ApId, status: MCPStatus }): Promise<MCP> {

        const mcp = await repo().findOne({
            where: { id: mcpId },
        })

        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }

        await repo().update(mcpId, {
            status,
            updated: dayjs().toISOString(),
        })


        return repo().findOneOrFail({
            where: { id: mcpId },
            relations: ['connections'],
        })
    },

    async updateConnections({ mcpId, connectionsIds }: { mcpId: ApId, connectionsIds: string[] }): Promise<MCP> {

        const mcp = await repo().findOne({
            where: { id: mcpId },
            relations: ['connections'],
        })

        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }

        const queryBuilder = repo().createQueryBuilder()
            .relation(MCPEntity, 'connections')
            .of(mcpId)

        if (mcp.connections.length > 0) {
            await queryBuilder.remove(mcp.connections.map(c => c.id))
        }

        if (connectionsIds.length > 0) {
            await queryBuilder.add(connectionsIds)
        }

        await repo().update(mcpId, {
            updated: dayjs().toISOString(),
        })


        return repo().findOneOrFail({
            where: { id: mcpId },
            relations: ['connections'],
        })
    },

    async delete({ mcpId }: { mcpId: ApId }): Promise<void> {

        const mcp = await repo().findOne({
            where: { id: mcpId },
        })

        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }

        await repo().delete({ id: mcpId })
    },
})
