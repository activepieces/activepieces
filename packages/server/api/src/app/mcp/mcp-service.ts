import { ActivepiecesError, ApId, apId, AppConnectionWithoutSensitiveData, ErrorCode, isNil, MCPSchema, spreadIfDefined } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { appConnectionService, appConnectionsRepo } from '../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../core/db/repo-factory'
import { MCPEntity } from './mcp-entity'

const repo = repoFactory(MCPEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async getOrCreate({ projectId }: { projectId: ApId }): Promise<MCPSchema> {
        const existingMCP = await repo().findOneBy({ projectId })
        if (!isNil(existingMCP)) {
            return this.getOrThrow({ mcpId: existingMCP.id, log: _log })
        }
        const mcp = await repo().save({
            id: apId(),
            projectId,
            token: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId: mcp.id, log: _log })
    },

    async getOrThrow({ mcpId }: GetOrThrowParams): Promise<MCPSchema> {
        const mcp = await repo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }
        return {
            ...mcp,
            connections: await listConnections({ mcpId: mcp.id, log: _log }),
        }
    },

    async getByToken({ token }: { token: string }): Promise<MCPSchema> {
        const mcp = await repo().findOne({
            where: { token },
        })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: token },
            })
        }
        return this.getOrThrow({ mcpId: mcp.id, log: _log })
    },


    async update({ mcpId, token, connectionsIds }: UpdateParams): Promise<MCPSchema> {
        const mcp = await this.getOrThrow({ mcpId, log: _log })

        if (!isNil(connectionsIds)) {
            await appConnectionsRepo().update({
                id: In(connectionsIds),
            }, {
                mcpId: mcp.id,
            })
        }

        await repo().update(mcpId, {
            ...spreadIfDefined('token', token),
            updated: dayjs().toISOString(),
        })

        return this.getOrThrow({ mcpId, log: _log })
    },

    async delete({ mcpId }: { mcpId: ApId }): Promise<void> {
        const mcp = await this.getOrThrow({ mcpId, log: _log })

        await repo().delete({ id: mcp.id })
    },

})

async function listConnections({ mcpId, log }: GetOrThrowParams): Promise<AppConnectionWithoutSensitiveData[]> {
    const connections = await appConnectionsRepo().find({
        where: {
            mcpId,
        },
    })

    return Promise.all(connections.map(connection => appConnectionService(log).getOneOrThrowWithoutValue({
        id: connection.id,
        platformId: connection.platformId,
        projectId: connection.projectIds?.[0],
    })))
}

type UpdateParams = {
    mcpId: ApId
    token?: string
    connectionsIds?: string[]
}

type GetOrThrowParams = {
    mcpId: ApId
    log: FastifyBaseLogger
}