import { MCP, MCPSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, ApId, apId, AppConnection, ErrorCode, ProjectId, spreadIfDefined } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { MCPEntity } from './mcp-entity'

const repo = repoFactory(MCPEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async getOrCreate({ projectId }: { projectId: ApId }): Promise<MCPSchema> {
        const existingMCP = await repo().findOne({
            where: { projectId },
        })
        

        if (existingMCP) {
            const connections = await this.getConnectionsByMcpId({ mcpId: existingMCP.id})
            return {
                ...existingMCP,
                connections,
            }
        }

        const mcpId = apId()
        await repo().createQueryBuilder()
            .insert()
            .into(MCPEntity)
            .values({
                id: mcpId,
                projectId,
                token: apId(),
                created: dayjs().toISOString(),
                updated: dayjs().toISOString(),
            })
            .execute()


        return repo().findOneOrFail({
            where: { id: mcpId },
        })
    },

    async get({ mcpId }: { mcpId: ApId }): Promise<MCPSchema> {
        const mcp = await repo().findOne({
            where: { id: mcpId },
        })

        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }
        const connections = await this.getConnectionsByMcpId({ mcpId: mcp.id })

        return {
            ...mcp,
            connections,
        }
    },

    async getByToken({ token }: { token: string }): Promise<MCPSchema> {
        const mcp = await repo().findOne({
            where: { token },
        })
        
        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: token },
            })
        }

        const connections = await this.getConnectionsByMcpId({ mcpId: mcp.id })
        return {
            ...mcp,
            connections,
        }
    },
    

    async update({ mcpId, token, connectionsIds }: UpdateParams): Promise<MCPSchema> {
        const mcp = await repo().findOne({
            where: { id: mcpId },
        })

        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }


        if (connectionsIds !== undefined) {
            try {
 
                const relationRepo = repo().manager.connection.getRepository('mcp_connection');
                
                await relationRepo.delete({ mcpId });
                
                if (connectionsIds.length > 0) {
                    const connectionEntries = connectionsIds.map(connectionId => ({
                        mcpId,
                        connectionId,
                    }));
                    
                    await relationRepo.insert(connectionEntries);
                }
            } catch (err) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `Failed to update MCP connections: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    },
                })
            }
        }

        await repo().update(mcpId, {
            ...spreadIfDefined('token', token),
            updated: dayjs().toISOString(),
        })

        const connections = await this.getConnectionsByMcpId({ mcpId: mcp.id })
        return {
            ...mcp,
            connections,
        }
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

    async rotateToken({ mcpId }: { mcpId: ApId }): Promise<MCPSchema> {
        const mcp = await repo().findOne({
            where: { id: mcpId },
        })

        if (!mcp) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }

        const newToken = apId()
        await repo().update(mcpId, {
            token: newToken,
            updated: dayjs().toISOString(),
        })

        const connections = await this.getConnectionsByMcpId({ mcpId: mcp.id })

        return {
            ...mcp,
            connections,
        }
    },

    async getConnectionsByMcpId({ mcpId }: { mcpId: ApId }): Promise<AppConnection[]> {
        const queryBuilder = repo().createQueryBuilder()
        .relation(MCPEntity, 'connections')
        .of(mcpId);

        const connections = await queryBuilder.loadMany();

        return connections;
    },
})

type UpdateParams = {
    mcpId: ApId
    token?: string
    connectionsIds?: string[]
}