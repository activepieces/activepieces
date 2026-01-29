import { AgentPieceTool, EngineOperationType, EngineResponseStatus, ExecuteToolOperation, ExecuteToolResponse } from '@activepieces/shared'
import { tool, Tool } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { engineApiService } from '../../../api/server-api.service'
import { executionFiles } from '../../../cache/execution-files'
import { pieceWorkerCache } from '../../../cache/piece-worker-cache'
import { Sandbox } from '../../../compute/sandbox/sandbox'
import { sandboxPool } from '../../../compute/sandbox/sandbox-pool'
import { workerMachine } from '../../../utils/machine'

type ExecuteToolOperationInput = Omit<ExecuteToolOperation, 'publicApiUrl' | 'internalApiUrl' | 'engineToken'> & {
    modelId: string
}

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
                            return pieceToolExecutor(log).executeTool(engineToken, {
                                instruction,
                                pieceName: agentTool.pieceMetadata.pieceName,
                                pieceVersion: agentTool.pieceMetadata.pieceVersion,
                                actionName: agentTool.pieceMetadata.actionName,
                                predefinedInput: agentTool.pieceMetadata.predefinedInput,
                                platformId,
                                projectId,
                                modelId,
                                timeoutInSeconds: 600,
                            })
                        },
                    }),
                }
            }),
        )

        return Object.fromEntries(pieceTools.map((t) => [t.name, t.tool]))
    },

    async executeTool(
        engineToken: string,
        operation: ExecuteToolOperationInput,
    ): Promise<ExecuteToolResponse> {
        const piece = await pieceWorkerCache(log).getPiece({
            engineToken,
            pieceName: operation.pieceName,
            pieceVersion: operation.pieceVersion,
            platformId: operation.platformId,
        })

        await executionFiles(log).provision({
            pieces: [piece],
            codeSteps: [],
        })

        const input: ExecuteToolOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }

        let sandbox: Sandbox | undefined
        try {
            sandbox = sandboxPool.allocate(log)
            await sandbox.start({ flowVersionId: undefined, platformId: operation.platformId })

            const { engine } = await sandbox.execute(EngineOperationType.EXECUTE_TOOL, input, {
                timeoutInSeconds: operation.timeoutInSeconds,
            })

            if (engine.status !== EngineResponseStatus.OK) {
                throw new Error(`Tool execution failed with status: ${engine.status}`)
            }

            return engine.response as ExecuteToolResponse
        }
        finally {
            await sandboxPool.release(sandbox)
        }
    },
})
