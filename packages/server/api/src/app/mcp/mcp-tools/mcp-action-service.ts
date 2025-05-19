import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    ErrorCode, 
    isNil, 
    Mcp,
    McpAction,
    McpActionWithConnection,
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
import { McpActionEntity } from './mcp-action-entity'

const mcpRepo = repoFactory(McpEntity)
const mcpActionRepo = repoFactory(McpActionEntity)

export const mcpActionService = (_log: FastifyBaseLogger) => ({
    async listActions(mcpId: ApId): Promise<McpActionWithConnection[]> {
        await this.validateMcp(mcpId)
        
        const actions = await mcpActionRepo().find({ 
            where: { mcpId },
        })
        
        const actionsWithConnection = await Promise.all(
            actions.map(async (action) => {
                return enrichWithConnection(action, _log) as Promise<McpActionWithConnection>
            }),
        )
        
        return actionsWithConnection
    },

    async listPieces(mcpId: ApId): Promise<McpPieceWithConnection[]> {
        await this.validateMcp(mcpId)
        
        const pieces = await mcpActionRepo()
            .createQueryBuilder('action')
            .select(['action.pieceName', 'action.pieceVersion', 'action.mcpId'])
            .where('action.mcpId = :mcpId', { mcpId })
            .distinct(true)
            .getMany()

        const piecesWithConnection = await Promise.all(
            pieces.map(async (piece) => {
                return enrichWithConnection(piece, _log)
            }),
        )
        
        return piecesWithConnection
    },

    async getOne(actionId: string): Promise<McpActionWithConnection | null> {      
        const action = await mcpActionRepo().findOne({
            where: { id: actionId },
        })

        if (isNil(action)) {
            return null
        }

        return enrichWithConnection(action, _log) as Promise<McpActionWithConnection>
    },

    async getOneOrThrow(actionId: string): Promise<McpActionWithConnection> {
        const action = await this.getOne(actionId)
        
        if (isNil(action)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: actionId,
                    entityType: 'McpAction',
                },
            })
        }
        
        return enrichWithConnection(action, _log) as Promise<McpActionWithConnection>
    },

    async getMcpId(actionId: string): Promise<string> {
        const action = await this.getOne(actionId)
        if (isNil(action)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: actionId, entityType: 'McpAction' },
            })
        }
        return action.mcpId
    },

    async delete(actionId: string): Promise<void> {
        const action = await this.getOneOrThrow(actionId)
        await mcpActionRepo().delete({ id: actionId })
        await _updateMcpTimestamp(action.mcpId)
    },
    
    async updateBatch({ mcpId, pieceName, pieceVersion, actionNames, connectionId }: UpdateBatchParams): Promise<McpActionWithConnection[]> {
        const mcp = await this.validateMcp(mcpId)
        const project = await projectService.getOneOrThrow(mcp.projectId)
        
        await this.validatePiece({
            pieceName,
            pieceVersion,
            actionNames,
            projectId: mcp.projectId,
            platformId: project.platformId
        })
        
        if (!isNil(connectionId)) {
            await validateMcpPieceConnection({ 
                pieceName, 
                connectionId, 
                projectId: mcp.projectId, 
                log: _log, 
                platformId: project.platformId 
            })
        }

        await mcpActionRepo().delete({ mcpId, pieceName })
        
        if (actionNames.length > 0) {
            const actions = actionNames.map(actionName => ({
                id: apId(),
                created: dayjs().toISOString(),
                updated: dayjs().toISOString(),
                mcpId,
                actionName,
                pieceName,
                pieceVersion,
                connectionId
            }))
            
            await mcpActionRepo().save(actions)
        }
        
        await _updateMcpTimestamp(mcpId)
        
        return this.listActions(mcpId)
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
                        message: `Invalid action name(s) for piece ${pieceName}@${pieceVersion}: ${invalidActionNames.join(', ')}. Valid actions are: ${Array.from(validActionNames).join(', ')}`
                    },
                })
            }
        }
    },
})

async function _updateMcpTimestamp(mcpId: ApId): Promise<void> {
    await mcpRepo().update({ id: mcpId }, { updated: dayjs().toISOString() })
}

async function enrichWithConnection(
    item: McpAction | McpPiece,
    log: FastifyBaseLogger
): Promise<McpActionWithConnection | McpPieceWithConnection> {
    if (!item.connectionId) {
        return {
            ...item,
            connection: undefined,
        }
    }
    
    try {
        const connection = await appConnectionsRepo().findOneBy({ 
            id: item.connectionId,
        })
        
        if (isNil(connection)) {
            return {
                ...item,
                connection: undefined,
            }
        }

        const connectionWithoutSensitiveData = await appConnectionService(log).getOneOrThrowWithoutValue({
            id: connection.id,
            platformId: connection.platformId,
            projectId: connection.projectIds?.[0],
        })

        return {
            ...item,
            connection: connectionWithoutSensitiveData,
        }
    }
    catch (error) {
        return {
            ...item,
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

type UpdateBatchParams = {
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
