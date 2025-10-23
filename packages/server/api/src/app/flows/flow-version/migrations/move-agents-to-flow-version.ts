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
        const db = databaseConnection()

        const asyncTasks: Promise<void>[] = []

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === AGENT_PIECE_NAME) {
                const agentId = step.settings.input['agentId']
                const prompt = step.settings.input['prompt']

                const task = db
                    .query(`SELECT * FROM agent WHERE "id" = $1`, [agentId])
                    .then(async (agentQuery) => {
                        const agent = agentQuery[0]
                        if (!agent) return

                        const mcpToolsQuery = await db.query(
                            `SELECT * FROM mcp_tool WHERE "mcpId" = $1`,
                            [agent.mcpId]
                        )

                        const tools = mcpToolsQuery.map((tool: any) => {
                            if (tool.type === McpToolType.PIECE) {
                                return {
                                    toolName: tool.pieceMetadata.displayName,
                                    pieceMetadata: tool.pieceMetadata,
                                    type: tool.type,
                                }
                            }
                            if (tool.type === McpToolType.FLOW) {
                                return {
                                    toolName: tool.flowId,
                                    type: tool.type,
                                    flowId: tool.flowId,
                                }
                            }
                            return null
                        }).filter(Boolean)

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

                asyncTasks.push(task)
            }

            return step
        })

        Promise.all(asyncTasks)
            .then(() => console.log('Succeeded'))
            .catch((err) => console.error('Failed', err))

        return {
            ...newVersion,
            schemaVersion: '8',
        }
    },
}
