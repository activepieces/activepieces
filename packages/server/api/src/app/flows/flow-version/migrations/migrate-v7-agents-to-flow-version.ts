import {
    AGENT_PIECE_NAME,
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    Mcp,
    McpTool,
} from '@activepieces/shared'
import { databaseConnection } from '../../../database/database-connection'
import { Migration } from '.'

export const moveAgentsToFlowVerion: Migration = {
    targetSchemaVersion: '7',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const db = databaseConnection()

        const agentsAndMcpPromises = await Promise.all(flowStructureUtil.getAllSteps(flowVersion.trigger).map(async (step): Promise<{ agent: Record<string, unknown>, mcp: Mcp, tools: McpTool[] } | null> => {
            const agent = await db.query('SELECT * FROM agent WHERE "id" = $1', [step.settings.input['agentId']])
            if (!agent) {
                return null
            }
            const mcp = await db.query('SELECT * FROM mcp WHERE "id" = $1', [agent.mcpId])
            if (!mcp) {
                return null
            }
            const tools = await db.query('SELECT * FROM mcp_tool WHERE "mcpId" = $1', [mcp.id])
            if (!tools) {
                return null
            }
            return {
                agent,
                mcp,
                tools,
            }
        }))
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === AGENT_PIECE_NAME) {
                const prompt = step.settings.input['prompt']
                const agentAndMcp = agentsAndMcpPromises.find((agentAndMcp) => agentAndMcp?.agent?.id === step.settings.input['agentId'])
                if (!agentAndMcp) {
                    return step
                }
                const { agent, tools } = agentAndMcp

                step.displayName = agent?.displayName as string
                step.settings = {
                    ...step.settings,
                    input: {
                        [AgentPieceProps.PROMPT]: `${prompt}, ${agentAndMcp.agent?.systemPrompt}`,
                        [AgentPieceProps.AI_MODEL]: 'gpt-4o',
                        [AgentPieceProps.AI_PROVIDER]: 'openai',
                        [AgentPieceProps.MAX_STEPS]: 20,
                        [AgentPieceProps.STRUCTURED_OUTPUT]: agentAndMcp.agent?.outputFields,
                        [AgentPieceProps.AGENT_TOOLS]: tools,
                    },
                }
            }
            return step
        })

        return {
            ...newVersion,
            schemaVersion: '8',
        }
    },
}