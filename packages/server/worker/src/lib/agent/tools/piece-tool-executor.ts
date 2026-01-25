import { tool, Tool } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { engineApiService } from '../../api/server-api.service'
import { AgentPieceTool } from '@activepieces/shared'

type MakeToolsParams = {
    tools: AgentPieceTool[]
    engineToken: string
    platformId: string
    projectId: string
    modelId: string
}

export const pieceToolExecutor = (log: FastifyBaseLogger) => ({
    async makeTools({ tools, engineToken, platformId, projectId, modelId }: MakeToolsParams): Promise<Record<string, Tool>> {
        const pieceTools = await Promise.all(
            tools.map(async (agentTool) => {
                const pieceMetadata = await engineApiService(engineToken).getPiece(
                    agentTool.pieceMetadata.pieceName,
                    { version: agentTool.pieceMetadata.pieceVersion },
                )
                const action = pieceMetadata.actions[agentTool.pieceMetadata.actionName]
                const description = action?.description ?? `Execute ${agentTool.toolName}`

                return {
                    name: agentTool.toolName,
                    tool: tool({
                        description,
                        inputSchema: z.object({
                            instruction: z.string().describe('A natural language instruction describing what you want this tool to do. Specify the goal clearly, and provide all required details or parameters for the task.'),
                        }),
                        execute: async ({ instruction }) => {
                            
                            return {}
                        },
                    }),
                }
            }),
        )

        return Object.fromEntries(pieceTools.map((t) => [t.name, t.tool]))
    },

})

