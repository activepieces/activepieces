import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    ErrorCode, 
    isNil, 
    MCP,
    MCPPiece,
    MCPPieceStatus,
    MCPPieceWithConnection,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService, appConnectionsRepo } from '../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../core/db/repo-factory'
import { MCPEntity } from './mcp-entity'
import { MCPPieceEntity } from './mcp-piece-entity'

const mcpRepo = repoFactory(MCPEntity)
const mcpPieceRepo = repoFactory(MCPPieceEntity)

export const mcpPieceService = (_log: FastifyBaseLogger) => ({
    async list(mcpId: ApId): Promise<MCPPieceWithConnection[]> {
        await this.validateMcp(mcpId)
        
        const pieces = await mcpPieceRepo().find({ 
            where: { mcpId },
        })
        
        const piecesWithConnection = await Promise.all(
            pieces.map(async (piece) => {
                return enrichPieceWithConnection(piece, _log)
            }),
        )
        
        return piecesWithConnection
    },

    async add({ mcpId, pieceName, status, connectionId }: AddParams): Promise<MCPPieceWithConnection> {
        await this.validateMcp(mcpId)
        
        const existingPiece = await mcpPieceRepo().findOne({
            where: { mcpId, pieceName },
        })

        if (!isNil(existingPiece)) {
            return enrichPieceWithConnection(existingPiece, _log)
        }
        
        const piece = await mcpPieceRepo().save({
            id: apId(),
            mcpId,
            pieceName,
            status,
            connectionId,
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        
        return enrichPieceWithConnection(piece, _log)
    },

    async getOne(pieceId: string): Promise<MCPPieceWithConnection | null    > {      
        const piece = await mcpPieceRepo().findOne({
            where: { id: pieceId },
        })

        if (isNil(piece)) {
            return null
        }

        return enrichPieceWithConnection(piece, _log)
    },

    async getOneOrThrow(pieceId: string): Promise<MCPPieceWithConnection> {
        const piece = await this.getOne(pieceId)
        
        if (isNil(piece)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: pieceId,
                    entityType: 'MCPPiece',
                },
            })
        }
        
        return piece
    },

    async getMcpId(pieceId: string): Promise<string> {
        const piece = await this.getOne(pieceId)
        if (isNil(piece)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: pieceId, entityType: 'MCPPiece' },
            })
        }
        return piece.mcpId
    },

    async delete(pieceId: string): Promise<void> {
        await mcpPieceRepo().delete({ id: pieceId })
    },
    
    async update({ pieceId, status, connectionId }: UpdateParams): Promise<MCPPieceWithConnection> {
        const piece = await this.getOneOrThrow(pieceId)
        
        if (!isNil(status)) {
            await mcpPieceRepo().update(
                { id: piece.id },
                { 
                    status,
                    updated: dayjs().toISOString(),
                },
            )
        }

        if (!isNil(connectionId)) {
            await mcpPieceRepo().update(
                { id: piece.id },
                { connectionId },
            )
        }   
        
        return this.getOneOrThrow(pieceId)
    },

    async validateMcp(mcpId: ApId): Promise<MCP> {
        const mcp = await mcpRepo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_NOT_FOUND,
                params: { id: mcpId },
            })
        }

        return mcp
    },
})

async function enrichPieceWithConnection(piece: MCPPiece, log: FastifyBaseLogger): Promise<MCPPieceWithConnection> {
    if (!piece.connectionId) {
        return {
            ...piece,
            connection: undefined,
        }
    }
    
    try {
        const connection = await appConnectionsRepo().findOneBy({ 
            id: piece.connectionId,
        })
        
        if (isNil(connection)) {
            return {
                ...piece,
                connection: undefined,
            }
        }

        const connectionWithoutSensitiveData = await appConnectionService(log).getOneOrThrowWithoutValue({
            id: connection.id,
            platformId: connection.platformId,
            projectId: connection.projectIds?.[0],
        })

        return {
            ...piece,
            connection: connectionWithoutSensitiveData,
        }
    }
    catch (error) {
        return {
            ...piece,
            connection: undefined,
        }
    }
}

type AddParams = {
    mcpId: string
    pieceName: string
    status: MCPPieceStatus
    connectionId?: string
}

type UpdateParams = {
    pieceId: string
    status?: MCPPieceStatus
    connectionId?: string
}
