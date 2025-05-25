import { ActivepiecesError, ErrorCode, isNil, McpFlowToolData, McpPieceToolData, TriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

export const mcpToolHandler = {
    async validateFlow({ data, projectId, log }: ValidateFlowParams): Promise<void> {
        data.flowIds.forEach(async flowId => {
            const flow = await flowService(log).getOne({
                id: flowId,
                projectId,
            })

            if (isNil(flow)) {
                return
            }

            if (flow.publishedVersionId === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `Flow ${flow.id} has no published version`,
                    },
                })
            }
            
            const publishedVersion = await flowVersionService(log).getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: flow.publishedVersionId,
            })

            const isMcpTrigger = publishedVersion.trigger.type === TriggerType.PIECE && publishedVersion.trigger.settings.pieceName === '@activepieces/piece-mcp'

            if (!isMcpTrigger) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `Flow ${flow.id} has no MCP trigger`,
                    },
                })
            }
        })
    },

    async validatePiece({ data, projectId, platformId, log }: ValidatePieceParams): Promise<void> {
        const piece = await pieceMetadataService(log).getOrThrow({
            name: data.pieceName,
            version: data.pieceVersion,
            projectId,
            platformId,
        })

        
        if (data.actionNames.length === 0) {
            return
        }

        const validActionNames = new Set(Object.keys(piece.actions || {}))
        
        const invalidActionNames = data.actionNames.filter(name => !validActionNames.has(name))
        
        if (invalidActionNames.length > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { 
                    message: `Invalid action name(s) for piece ${data.pieceName}@${data.pieceVersion}: ${invalidActionNames.join(', ')}. Valid actions are: ${Array.from(validActionNames).join(', ')}`,
                },
            })
        }
    },
}

type ValidatePieceParams = {
    data: McpPieceToolData
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

type ValidateFlowParams = {
    data: McpFlowToolData
    projectId: string
    log: FastifyBaseLogger
}