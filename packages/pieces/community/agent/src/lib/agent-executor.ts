import { Agent, agentbuiltInToolsNames, AgentStepBlock, AgentTaskStatus, AgentTestResult, AIErrorResponse, assertNotNullOrUndefined, ContentBlockType, isNil, McpToolMetadata, mcpToolNaming, McpToolType, McpWithTools, ToolCallContentBlock, ToolCallStatus, ToolCallType } from "@activepieces/shared"
import { APICallError, streamText } from "ai"
import { agentCommon } from "./common"
import { agentTools } from "./agent-tools"
import { agentMcp } from "./agent-mcp"

export const agentExecutor = {
    async execute(params: ExecuteAgent) {

        const agent = await agentCommon.getAgent({
            publicUrl: params.publicUrl,
            token: params.serverToken,
            id: params.agentId,
        })

        const mcp = await agentMcp.getMcp({
            publicUrl: params.publicUrl,
            token: params.serverToken,
            mcpId: agent.mcpId,
        })

        const agentToolInstance = await agentTools({
            agent,
            publicUrl: params.publicUrl,
            token: params.serverToken,
            mcp,
        })
        try {
            const model = await agentCommon.initializeOpenAIModel({
                publicUrl: params.publicUrl,
                token: params.serverToken,
            })
            const { fullStream } = streamText({
                model,
                system: constructSystemPrompt(agent),
                prompt: params.prompt,
                maxSteps: agent.maxSteps,
                tools: await agentToolInstance.tools(),
            })
            const agentResult: AgentTestResult = {
                steps: [],
                status: AgentTaskStatus.IN_PROGRESS,
                output: undefined,
                message: '',
            }
            let currentText = ''

            for await (const chunk of fullStream) {
                if (chunk.type === 'text-delta') {
                    currentText += chunk.textDelta
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
                        input: chunk.args as Record<string, unknown>,
                        output: undefined,
                        startTime: new Date().toISOString(),
                    })
                    agentResult.steps.push(metadata)
                } else if (chunk.type === 'tool-result') {
                    const lastBlockIndex = agentResult.steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && block.toolCallId === chunk.toolCallId)
                    const lastBlock = agentResult.steps[lastBlockIndex] as ToolCallContentBlock
                    assertNotNullOrUndefined(lastBlock, 'Last block must be a tool call')
                    agentResult.steps[lastBlockIndex] = {
                        ...lastBlock,
                        status: ToolCallStatus.COMPLETED,
                        endTime: new Date().toISOString(),
                        output: chunk.result,
                    }
                } else if (chunk.type === 'error') {
                    agentResult.status = AgentTaskStatus.FAILED
                    if (APICallError.isInstance(chunk.error)) {
                        const errorResponse = (chunk.error as any)?.data as AIErrorResponse
                        agentResult.message = errorResponse?.error?.message ?? JSON.stringify(chunk.error)
                    }
                    else {
                        agentResult.message = concatMarkdown(agentResult.steps) + '\n' + JSON.stringify(chunk.error, null, 2)
                    }
                    await params.update(agentResult)
                    return agentResult
                }
                await params.update(agentResult)
            }
            if (currentText.length > 0) {
                agentResult.steps.push({
                    type: ContentBlockType.MARKDOWN,
                    markdown: currentText,
                })
            }

            const markAsComplete = agentResult.steps.find(isMarkAsComplete) as ToolCallContentBlock | undefined
            agentResult.output = markAsComplete?.input
            agentResult.status = !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
            agentResult.message = concatMarkdown(agentResult.steps)

            await params.update(agentResult)

            return agentResult
        }
        finally {
            await agentToolInstance.close()
        }
    }

}


function isMarkAsComplete(block: AgentStepBlock): boolean {
    return block.type === ContentBlockType.TOOL_CALL && block.toolName === agentbuiltInToolsNames.markAsComplete
}


function getMetadata(toolName: string, mcp: McpWithTools, baseTool: Pick<ToolCallContentBlock, 'startTime' | 'endTime' | 'input' | 'output' | 'status' | 'toolName' | 'toolCallId' | 'type'>): ToolCallContentBlock {
    if (toolName === agentbuiltInToolsNames.markAsComplete) {
        return {
            ...baseTool,
            toolCallType: ToolCallType.INTERNAL,
            displayName: 'Mark as Complete',
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

function constructSystemPrompt(agent: Agent) {
    return `
    You are an autonomous assistant designed to efficiently achieve the user's goal.

    YOU MUST ALWAYS call the mark as complete tool with the output or message wether you have successfully completed the task or not.
    
    **Today's Date**: ${new Date().toISOString()}  
    Use this to interpret time-based queries like "this week" or "due tomorrow."

    ---
    ${agent.systemPrompt}
    `
}

function concatMarkdown(blocks: AgentStepBlock[]): string {
    return blocks.filter((block) => block.type === ContentBlockType.MARKDOWN).map((block) => block.markdown).join('\n')
}

type ExecuteAgent = {
    agentId: string
    prompt: string
    update: (data: Record<string, unknown>) => Promise<void>
    serverToken: string
    publicUrl: string
    flowId: string
    runId: string
}