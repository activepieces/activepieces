import {
    AGENT_PIECE_NAME,
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    McpToolType,
} from '@activepieces/shared'
import { Migration } from '.'
import { databaseConnection } from '../../../database/database-connection'

export const moveAgentsToFlowVerion: Migration = {
    targetSchemaVersion: '7',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === AGENT_PIECE_NAME) {
                const agentId = step.settings.input['agentId']
                const prompt = step.settings.input['prompt']

                databaseConnection()
                    .query(`SELECT * FROM agent WHERE "id" = $1`, [agentId])
                    .then((agentQuery) => {
                        const agent = agentQuery[0]
                        if (!agent) return

                        databaseConnection()
                            .query(`SELECT * FROM mcp_tool WHERE "mcpId" = $1`, [agent.mcpId])
                            .then((mcpToolsQuery) => {
                                const tools: any[] = []

                                for (const tool of mcpToolsQuery) {
                                    if (tool.type === McpToolType.PIECE) {
                                        tools.push({
                                            toolName: tool.pieceMetadata.displayName,
                                            pieceMetadata: tool.pieceMetadata,
                                            type: tool.type,
                                        })
                                    } else if (tool.type === McpToolType.FLOW) {
                                        tools.push({
                                            toolName: tool.flowId,
                                            type: tool.type,
                                            flowId: tool.flowId,
                                        })
                                    }
                                }

                                step.displayName = agent.displayName
                                step.settings = {
                                    ...step.settings,
                                    input: {
                                        [AgentPieceProps.PROMPT]: `${prompt}, ${agent.prompt}`,
                                        [AgentPieceProps.AI_MODEL]: 'gpt-4o',
                                        [AgentPieceProps.AI_PROVIDER]: 'openai',
                                        [AgentPieceProps.MAX_STEPS]: 20,
                                        [AgentPieceProps.STRUCTURED_OUTPUT]: agent.outputFields,
                                        [AgentPieceProps.AGENT_TOOLS]: tools,
                                    },
                                }
                            })
                    })
            }

            return step
        })

        return {
            ...newVersion,
            schemaVersion: '8',
        }
    },
}