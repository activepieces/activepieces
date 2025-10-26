import {
    AGENT_PIECE_NAME,
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    McpTool,
    McpToolType,
    PopulatedFlow,
} from '@activepieces/shared'
import { databaseConnection } from '../../../database/database-connection'
import { Migration } from '.'

export const moveAgentsToFlowVerion: Migration = {
    targetSchemaVersion: '7',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const db = databaseConnection()
        
        const agentsAndMcpPromises = await Promise.all(
            flowStructureUtil.getAllSteps(flowVersion.trigger).map(async (step): Promise<{ agent: Record<string, unknown>, tools: McpTool[] } | null> => {
                if (step.type === FlowActionType.PIECE && step.settings.pieceName === AGENT_PIECE_NAME) {
                    const agentResults = await db.query('SELECT * FROM agent WHERE "externalId" = $1', [step.settings.input['agentId']])
                    const agent = agentResults[0]

                    if (isNil(agent)) {
                        return null
                    }

                    const dbTools = await db.query('SELECT * FROM mcp_tool WHERE "mcpId" = $1', [agent.mcpId])

                    if (isNil(dbTools)) {
                        return {
                            agent,
                            tools: []
                        }
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tools = dbTools.map((tool: any) =>  {
                        if (tool.type === McpToolType.PIECE) {
                            const pieceMetadata = JSON.parse(tool.pieceMetadata) 
                            return {
                                type: tool.type,
                                toolName: pieceMetadata.actionName,
                                pieceMetadata,
                                mcpId: tool.mcpId,
                            }
                        }
                        else {
                            const populatedFlow = JSON.parse(tool.flow) as PopulatedFlow
                            return {
                                type: tool.type,
                                toolName: populatedFlow.id,
                                mcpId: tool.mcpId,
                                flow: populatedFlow, 
                                flowId: tool.flowId,
                            }
                        }
                    })

                    return {
                        agent,
                        tools,
                    }
                }

                return null
            }),
        )
        
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === AGENT_PIECE_NAME) {
                const prompt = step.settings.input['prompt']
                const agentAndTools = agentsAndMcpPromises.find((agentAndMcp) => agentAndMcp?.agent?.externalId === step.settings.input['agentId'])

                if (!agentAndTools) {
                    return step
                }
                
                const { agent, tools } = agentAndTools
                
                step.displayName = agent?.displayName as string
                step.settings = {
                    ...step.settings,
                    input: {
                        [AgentPieceProps.PROMPT]: `${agent?.systemPrompt}, ${prompt}`,
                        [AgentPieceProps.AI_MODEL]: 'openai-gpt-4o',
                        [AgentPieceProps.MAX_STEPS]: agent?.maxSteps,
                        [AgentPieceProps.STRUCTURED_OUTPUT]: JSON.parse(agent?.outputFields as string || '[]'),
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