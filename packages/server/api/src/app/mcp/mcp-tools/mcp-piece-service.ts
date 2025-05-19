import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    ErrorCode, 
    isNil, 
    Mcp,
    McpPiece,
    McpPieceStatus,
    McpPieceWithConnection,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService, appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { McpEntity } from '../mcp-server/mcp-entity'
import { McpPieceEntity } from './mcp-piece-entity'

const mcpRepo = repoFactory(McpEntity)
const mcpPieceRepo = repoFactory(McpPieceEntity)

async function _updateMcpTimestamp(mcpId: ApId): Promise<void> {
    await mcpRepo().update({ id: mcpId }, { updated: dayjs().toISOString() })
}

export const mcpPieceService = (_log: FastifyBaseLogger) => ({
    async list(mcpId: ApId): Promise<McpPieceWithConnection[]> {
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

    async add({ mcpId, pieceName, status, connectionId }: AddParams): Promise<McpPieceWithConnection> {
        const mcp = await this.validateMcp(mcpId)
        const project = await projectService.getOneOrThrow(mcp.projectId)
        await validateMcpPieceConnection({ pieceName, connectionId, projectId: mcp.projectId, log: _log, platformId: project.platformId })
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

        await _updateMcpTimestamp(mcpId)
        
        return enrichPieceWithConnection(piece, _log)
    },

    async getOne(pieceId: string): Promise<McpPieceWithConnection | null    > {      
        const piece = await mcpPieceRepo().findOne({
            where: { id: pieceId },
        })

        if (isNil(piece)) {
            return null
        }

        return enrichPieceWithConnection(piece, _log)
    },

    async getOneOrThrow(pieceId: string): Promise<McpPieceWithConnection> {
        const piece = await this.getOne(pieceId)
        
        if (isNil(piece)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: pieceId,
                    entityType: 'McpPiece',
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
                params: { entityId: pieceId, entityType: 'McpPiece' },
            })
        }
        return piece.mcpId
    },

    async delete(pieceId: string): Promise<void> {
        const piece = await this.getOneOrThrow(pieceId)
        await mcpPieceRepo().delete({ id: pieceId })
        await _updateMcpTimestamp(piece.mcpId)
    },
    
    async update({ pieceId, status, connectionId }: UpdateParams): Promise<McpPieceWithConnection> {
        const piece = await this.getOneOrThrow(pieceId)
        const mcp = await this.validateMcp(piece.mcpId)
        const project = await projectService.getOneOrThrow(mcp.projectId)
       
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
            await validateMcpPieceConnection({ pieceName: piece.pieceName, connectionId, projectId: mcp.projectId, log: _log, platformId: project.platformId })
            await mcpPieceRepo().update(
                { id: piece.id },
                { connectionId },
            )
        }   
        
        await _updateMcpTimestamp(piece.mcpId)
        return this.getOneOrThrow(pieceId)
    },

    async validateMcp(mcpId: ApId): Promise<Mcp> {
        const mcp = await mcpRepo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }

        return mcp
    },
})

async function enrichPieceWithConnection(piece: McpPiece, log: FastifyBaseLogger): Promise<McpPieceWithConnection> {
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



const validateMcpPieceConnection = async ({ pieceName, connectionId, projectId, log, platformId }: { pieceName: string, connectionId?: string, log: FastifyBaseLogger, projectId: string, platformId: string })  => {
    const piece = await pieceMetadataService(log).getOrThrow({
        name: pieceName,
        platformId,
        version: undefined,
        projectId,
    })
    if (piece.auth && !connectionId) {
        throw new ActivepiecesError({
            code: ErrorCode.MCP_PIECE_REQUIRES_CONNECTION,
            params: { pieceName },
        })
    }
    if (connectionId) {
        const connection = await appConnectionService(log).getOneOrThrowWithoutValue({
            id: connectionId,
            platformId,
            projectId,
        })
        if (connection.pieceName !== pieceName) {
            throw new ActivepiecesError({
                code: ErrorCode.MCP_PIECE_CONNECTION_MISMATCH,
                params: { pieceName, connectionPieceName: connection.pieceName, connectionId },
            })
        }
    }
  
   
}
type AddParams = {
    mcpId: string
    pieceName: string
    status: McpPieceStatus
    connectionId?: string
}

type UpdateParams = {
    pieceId: string
    status?: McpPieceStatus
    connectionId?: string
}
