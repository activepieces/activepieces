import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    ErrorCode, 
    isNil, 
    spreadIfDefined,
    Mcp,
    McpPiece,
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


        // TODO: See why this is not working
        // return piecesWithConnection
        // Ensure all pieces have a valid actionNames array
        return piecesWithConnection.map(piece => ({
            ...piece,
            actionNames: Array.isArray(piece.actionNames) ? piece.actionNames : []
        }))
    },


    async getOne(pieceId: string): Promise<McpPieceWithConnection | null> {      
        const piece = await mcpPieceRepo().findOneBy({ id: pieceId })

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
        
        return enrichPieceWithConnection(piece, _log)
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

    async getPieceId(mcpId: string, pieceName: string, pieceVersion: string): Promise<string> {
        const piece = await mcpPieceRepo().findOneBy({ mcpId, pieceName, pieceVersion })
        if (isNil(piece)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: pieceName, entityType: 'McpPiece' },
            })
        }
        return piece.id
    },

    async delete(pieceId: string): Promise<void> {
        const piece = await this.getOneOrThrow(pieceId)
        await mcpPieceRepo().delete({ id: pieceId })
        await _updateMcpTimestamp(piece.mcpId)
    },
    
    async upsert({ mcpId, pieceName, pieceVersion, actionNames, connectionId }: UpsertParams): Promise<McpPieceWithConnection> {
        const mcp = await this.validateMcp(mcpId)
        const project = await projectService.getOneOrThrow(mcp.projectId)
        
        console.log('HAHAHAHAHA BEFORE VALIDATE')
        await this.validatePiece({
            pieceName,
            pieceVersion,
            actionNames,
            projectId: mcp.projectId,
            platformId: project.platformId,
        })
        console.log('HAHAHAHAHA AFTER VALIDATE')
        
        if (!isNil(connectionId)) {
            await validateMcpPieceConnection({ 
                pieceName, 
                connectionId, 
                projectId: mcp.projectId, 
                log: _log, 
                platformId: project.platformId, 
            })
            console.log('HAHAHAHAHA AFTER VALIDATE CONNECTION')
        }

        const existingPiece = await mcpPieceRepo().findOneBy({ mcpId, pieceName, pieceVersion })
        console.log('HAHAHAHAHA AFTER FIND ONE')
        const newId = existingPiece?.id ?? apId()
        console.log('HAHAHAHAHA AFTER NEW ID')
        const piece = {
            id: newId,
            mcpId,
            pieceName,
            pieceVersion,
            actionNames,
            ...spreadIfDefined('connectionId', connectionId),
        }
        console.log('HAHAHAHAHA AFTER PIECE')
        await mcpPieceRepo().upsert(piece, ['id'])
        console.log('HAHAHAHAHA AFTER UPSERT')
        await _updateMcpTimestamp(mcpId)
        console.log('HAHAHAHAHA AFTER UPDATE MCP TIMESTAMP')
        return this.getOneOrThrow(newId)
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

    async validatePiece({ pieceName, pieceVersion, actionNames, projectId, platformId }: ValidatePieceParams): Promise<void> {
        const piece = await pieceMetadataService(_log).getOrThrow({
            name: pieceName,
            version: pieceVersion,
            projectId,
            platformId,
        })

        
        if (actionNames.length > 0) {
            const validActionNames = new Set(Object.keys(piece.actions || {}))
            
            const invalidActionNames = actionNames.filter(name => !validActionNames.has(name))
            
            if (invalidActionNames.length > 0) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { 
                        message: `Invalid action name(s) for piece ${pieceName}@${pieceVersion}: ${invalidActionNames.join(', ')}. Valid actions are: ${Array.from(validActionNames).join(', ')}`,
                    },
                })
            }
        }
    },
})

async function _updateMcpTimestamp(mcpId: ApId): Promise<void> {
    await mcpRepo().update({ id: mcpId }, { updated: dayjs().toISOString() })
}

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

async function validateMcpPieceConnection({ pieceName, connectionId, projectId, platformId, log }: ValidateMcpPieceConnectionParams) {
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

type UpsertParams = {
    mcpId: string
    pieceName: string
    pieceVersion: string
    actionNames: string[]
    connectionId?: string
}

type ValidateMcpPieceConnectionParams = {
    pieceName: string
    connectionId: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

type ValidatePieceParams = {
    pieceName: string
    pieceVersion: string
    actionNames: string[]
    projectId: string
    platformId: string
}
