import {
    AGENT_PIECE_NAME,
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    Tool,
    ToolType,
} from '@activepieces/shared'
import { Migration } from '.'

export const cleanUpAgentTools: Migration = {
    targetSchemaVersion: '8',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === AGENT_PIECE_NAME) {
                const tools = step.settings.input['agentTools'] as Tool[]
                const newTools = tools.map(tool => {
                    switch (tool.type) {
                        case ToolType.PIECE: {
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
                                }
                            }
                        }
                        case ToolType.FLOW: {
                            return {
                                type: tool.type,
                                toolName: tool.toolName,
                                flowId: tool.flowId
                            }
                        }
                    }
                })
                
                step.settings = {
                    ...step.settings,
                    pieceVersion: '0.4.0',
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