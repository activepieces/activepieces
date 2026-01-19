import { AgentPieceTool, isNil } from "@activepieces/shared"
import { Tool } from "ai"
import { FastifyBaseLogger } from "fastify"
import { tsort } from "./tsort"
import { PieceMetadata } from "@activepieces/pieces-framework"
import z from "zod"
import { toolPropsExtraction } from "./tool-props-extraction"
import { LanguageModelV2 } from "@ai-sdk/provider"

export const agentPieceTools = (log: FastifyBaseLogger) => ({
    async construct({ platformId, tools, model }: ConstructToolParams): Promise<Record<string, Tool>> {

        const pieceTools = await Promise.all(tools.map(async (tool) => {
            const pieceMetadata: PieceMetadata = null as unknown as PieceMetadata;
            const pieceAction = pieceMetadata.actions[tool.pieceMetadata.actionName]
            if (isNil(pieceAction)) {
                return null;
            }
            return {
                name: tool.toolName,
                description: pieceAction.description,
                inputSchema: z.object({
                    instruction: z.string().describe('The instruction to the tool'),
                }),
                execute: async ({ instruction }: { instruction: string }) => {

                    const depthToPropertyMap = tsort.sortPropertiesByDependencies(pieceAction.props)
                    const resolvedInput = await toolPropsExtraction.resolveProperties(depthToPropertyMap, instruction, pieceAction, model, tool)

                    return {
                        output: resolvedInput,
                    }
                }
            }
        }))
        return {}
    }
})

type ConstructToolParams = {
    platformId: string
    model: LanguageModelV2
    tools: AgentPieceTool[]
}
