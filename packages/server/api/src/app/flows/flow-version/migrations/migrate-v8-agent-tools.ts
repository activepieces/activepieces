import {
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
} from '@activepieces/shared'
import { Migration } from '.'

export const cleanUpAgentTools: Migration = {
    targetSchemaVersion: '8',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === '@activepieces/piece-agent') {
                const tools = (step.settings.input['agentTools'] as { type: string, toolName: string, pieceMetadata: { pieceName: string, pieceVersion: string, actionName: string, connectionExternalId: string }, flowId: string }[]) ?? []
                const newTools = tools.map(tool => {
                    switch (tool.type) {
                        case 'PIECE': {
                            return {
                                type: tool.type,
                                toolName: tool.toolName,
                                pieceMetadata: {
                                    pieceName: tool.pieceMetadata.pieceName,
                                    pieceVersion: tool.pieceMetadata.pieceVersion,
                                    actionName: tool.pieceMetadata.actionName,
                                    predefinedInput: {
                                        auth: !isNil(tool.pieceMetadata.connectionExternalId) ? `{{connections['${tool.pieceMetadata.connectionExternalId}']}}` : undefined,
                                    },
                                },
                            }
                        }
                        case 'FLOW': {
                            return {
                                type: tool.type,
                                toolName: tool.toolName,
                                flowId: tool.flowId,
                            }
                        }
                        default: {
                            throw new Error(`Unknown tool type: ${tool.type}`)
                        }
                    }
                })

                step.settings = {
                    ...step.settings,
                    pieceVersion: '0.3.7',
                    input: {
                        ...step.settings.input,
                        [AgentPieceProps.AGENT_TOOLS]: newTools,
                    },
                }
            }
            return step
        })

        return {
            ...newVersion,
            schemaVersion: '9',
        }
    },
}