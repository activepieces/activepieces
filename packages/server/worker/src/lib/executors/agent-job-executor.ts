import { AIErrorResponse, AIUsageFeature, createAIModel } from '@activepieces/common-ai'
import { Agent, agentbuiltInToolsNames, AgentJobData, AgentStepBlock, AgentTaskStatus, assertNotNullOrUndefined, ContentBlockType, isNil, McpToolType, McpWithTools, ToolCallContentBlock, ToolCallStatus, ToolCallType, UpdateAgentRunRequestBody } from '@activepieces/shared'
import { openai } from '@ai-sdk/openai'
import { APICallError, stepCountIs, streamText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { agentsApiService } from '../api/server-api.service'
import { agentTools } from '../utils/agent-tools'
import { workerMachine } from '../utils/machine'

export const agentJobExecutor = (log: FastifyBaseLogger) => ({
    async executeAgent({ jobData, engineToken, workerToken }: ExecuteAgentParams): Promise<void> {
        let agentToolInstance: Awaited<ReturnType<typeof agentTools>> | undefined
        try {
            const agentResult: UpdateAgentRunRequestBody & { steps: AgentStepBlock[] } = {
                projectId: jobData.projectId,
                startTime: new Date().toISOString(),
                steps: [],
                message: '',
                status: AgentTaskStatus.IN_PROGRESS,
                output: undefined,
            }
            await agentsApiService(workerToken, log).updateAgentRun(jobData.agentRunId, agentResult)

            const agent = await agentsApiService(workerToken, log).getAgent(jobData.agentId)
            const mcp = await agentsApiService(workerToken, log).getMcp(agent.mcpId)
            agentToolInstance = await agentTools({
                agent,
                publicUrl: workerMachine.getPublicApiUrl(),
                token: engineToken,
                mcp,
            })

            const baseURL = `${workerMachine.getPublicApiUrl()}v1/ai-providers/proxy/openai`
            const model = createAIModel({
                providerName: 'openai',
                modelInstance: openai('gpt-4.1'),
                engineToken,
                baseURL,
                metadata: {
                    feature: AIUsageFeature.AGENTS,
                    agentid: jobData.agentId,
                },
            })
            const systemPrompt = await constructSystemPrompt(agent)
            const { fullStream } = streamText({
                model,
                system: systemPrompt,
                prompt: jobData.prompt,
                stopWhen: stepCountIs(agent.maxSteps),
                tools: await agentToolInstance.tools(),
            })
            let currentText = ''
    
            for await (const chunk of fullStream) {
                if (chunk.type === 'text-delta') {
                    currentText += chunk.text
                }
                else if (chunk.type === 'tool-call') { 
                    if (currentText.length > 0) {
                        agentResult.steps.push({
                            type: ContentBlockType.MARKDOWN,
                            markdown: currentText,
                        })
                        currentText = ''
                    }
                    const metadata = getMetadata(chunk.toolName, mcp, {
                        toolName: chunk.toolName,
                        toolCallId: chunk.toolCallId,
                        type: ContentBlockType.TOOL_CALL,
                        status: ToolCallStatus.IN_PROGRESS,
                        input: chunk.input as Record<string, unknown>,
                        output: undefined,
                        startTime: new Date().toISOString(),
                    })
                    agentResult.steps.push(metadata)
                }
                else if (chunk.type === 'tool-result') {
                    const lastBlockIndex = agentResult.steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && block.toolCallId === chunk.toolCallId)
                    const lastBlock = agentResult.steps[lastBlockIndex] as ToolCallContentBlock
                    assertNotNullOrUndefined(lastBlock, 'Last block must be a tool call')
                    agentResult.steps[lastBlockIndex] = {
                        ...lastBlock,
                        status: ToolCallStatus.COMPLETED,
                        endTime: new Date().toISOString(),
                        output: chunk.output,
                    }
                }
                else if (chunk.type === 'error') {
                    agentResult.status = AgentTaskStatus.FAILED
                    if (APICallError.isInstance(chunk.error)) {
                        const errorResponse = (chunk.error as unknown as { data: AIErrorResponse })?.data
                        agentResult.message = errorResponse?.error?.message ?? JSON.stringify(chunk.error)
                    }
                    else {
                        agentResult.message = concatMarkdown(agentResult.steps ?? []) + '\n' + JSON.stringify(chunk.error, null, 2)
                    }
                    agentResult.finishTime = new Date().toISOString()
                    await agentsApiService(workerToken, log).updateAgentRun(jobData.agentRunId, agentResult)
                    return
                }

                if (agentResult.steps.length > 0) {
                    await agentsApiService(workerToken, log).updateAgentRun(jobData.agentRunId, agentResult)
                }
            }
            if (currentText.length > 0) {
                agentResult.steps.push({
                    type: ContentBlockType.MARKDOWN,
                    markdown: currentText,
                })
            }

            const markAsComplete = agentResult.steps.find(isMarkAsComplete) as ToolCallContentBlock | undefined
            await agentsApiService(workerToken, log).updateAgentRun(jobData.agentRunId, {
                ...agentResult,
                output: markAsComplete?.input,
                status: !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
                message: concatMarkdown(agentResult.steps),
                finishTime: new Date().toISOString(),
            })

            log.info({
                agentRunId: jobData.agentRunId,
                agentId: jobData.agentId,
                projectId: jobData.projectId,
                status: agentResult.status,
                message: agentResult.message,
            }, 'Agent job completed')
        }
        catch (error) {
            log.error(error, 'Error executing agent job')
            throw error
        }
        finally {
            await agentToolInstance?.close()
        }
    },
})


function isMarkAsComplete(block: AgentStepBlock): boolean {
    return block.type === ContentBlockType.TOOL_CALL && block.toolName === agentbuiltInToolsNames.markAsComplete
}


function getMetadata(toolName: string, mcp: McpWithTools, baseTool: Pick<ToolCallContentBlock, 'startTime' | 'endTime' | 'input' | 'output' | 'status' | 'toolName' | 'toolCallId' | 'type'>): ToolCallContentBlock {
    if (toolName === agentbuiltInToolsNames.markAsComplete || toolName === agentbuiltInToolsNames.updateTableRecord) {
        return {
            ...baseTool,
            toolCallType: ToolCallType.INTERNAL,
            displayName: toolName === agentbuiltInToolsNames.markAsComplete ? 'Mark as Complete' : 'Update Table Record',
        }
    }
    const tool = mcp.tools.find((tool) => tool.toolName === toolName)
    if (!tool) {
        throw new Error(`Tool ${toolName} not found`)
    }
    switch (tool.type) {
        case McpToolType.PIECE: {
            const pieceMetadata = tool.pieceMetadata
            assertNotNullOrUndefined(pieceMetadata, 'Piece metadata is required')
            return {
                ...baseTool,
                toolCallType: ToolCallType.PIECE,
                pieceName: pieceMetadata.pieceName,
                pieceVersion: pieceMetadata.pieceVersion,
                actionName: tool.pieceMetadata.actionName,
            }
        }
        case McpToolType.FLOW: {
            assertNotNullOrUndefined(tool.flowId, 'Flow ID is required')
            return {
                ...baseTool,
                toolCallType: ToolCallType.FLOW,
                displayName: tool.flow?.version?.displayName ?? 'Unknown',
                flowId: tool.flowId,
            }
        }
    }
}

async function constructSystemPrompt(agent: Agent) {
    const systemPrompt = `
    You are an autonomous assistant designed to efficiently achieve the user's goal.
    YOU MUST ALWAYS call the mark as complete tool with the output or message wether you have successfully completed the task or not.
    You MUST ALWAYS do the requested task before calling the mark as complete tool.

    **Today's Date**: ${new Date().toISOString()}  
    Use this to interpret time-based queries like "this week" or "due tomorrow."

    ---
    ${agent.systemPrompt}
    `
    return systemPrompt
}

function concatMarkdown(blocks: AgentStepBlock[]): string {
    return blocks.filter((block) => block.type === ContentBlockType.MARKDOWN).map((block) => block.markdown).join('\n')
}

type ExecuteAgentParams = {
    jobData: AgentJobData
    engineToken: string
    workerToken: string
}