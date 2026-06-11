import {
    AgentResult,
    AgentStepBlock,
    AgentTaskStatus,
    AgentTool,
    AgentToolType,
    assertNotNullOrUndefined,
    ContentBlockType,
    ExecutionToolStatus,
    isNil,
    MarkdownContentBlock,
    ToolCallBase,
    ToolCallContentBlock,
    ToolCallStatus,
    ToolCallType,
} from '@activepieces/shared'

/**
 * Accumulates the agent's incremental output (markdown + tool-call blocks) into the `AgentResult`
 * shape the run-agent step returns. Worker-owned: the agent's `streamText` loop now runs here, so
 * this builder moved off the sandbox (the piece's copy is removed once run-agent becomes a shell).
 * Pure structural state — no I/O.
 */
export function agentOutputBuilder(prompt: string) {
    let status: AgentTaskStatus = AgentTaskStatus.IN_PROGRESS
    const steps: AgentStepBlock[] = []
    let structuredOutput: Record<string, unknown> | undefined = undefined
    let toolKeyToAgentTool: ToolKeyToAgentTool = {}

    return {
        setStatus(nextStatus: AgentTaskStatus): void {
            status = nextStatus
        },
        setToolMap(map: ToolKeyToAgentTool): void {
            toolKeyToAgentTool = map
        },
        setStructuredOutput(output: Record<string, unknown>): void {
            structuredOutput = output
        },
        appendErrorToStructuredOutput(errorDetails: unknown): void {
            if (structuredOutput) {
                structuredOutput['errors'] = [...(structuredOutput['errors'] as string[] || []), errorDetails]
            }
        },
        fail({ message }: FinishParams): void {
            status = AgentTaskStatus.FAILED
            if (!isNil(message)) {
                this.addMarkdown(message)
                this.appendErrorToStructuredOutput({ message })
            }
        },
        addMarkdown(markdown: string): void {
            if (steps.length === 0 || steps[steps.length - 1].type !== ContentBlockType.MARKDOWN) {
                steps.push({ type: ContentBlockType.MARKDOWN, markdown: '' })
            }
            (steps[steps.length - 1] as MarkdownContentBlock).markdown += markdown
        },
        startToolCall({ toolName, toolCallId, input }: StartToolCallParams): void {
            const baseTool: ToolCallBase = {
                toolName,
                toolCallId,
                type: ContentBlockType.TOOL_CALL,
                status: ToolCallStatus.IN_PROGRESS,
                input,
                output: undefined,
                startTime: new Date().toISOString(),
            }
            steps.push(getToolMetadata({ toolName, baseTool, toolKeyToAgentTool }))
        },
        finishToolCall({ toolCallId, output }: FinishToolCallParams): void {
            const toolIdx = steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && (block as ToolCallContentBlock).toolCallId === toolCallId)
            if (toolIdx === -1) {
                return
            }
            const tool = steps[toolIdx] as ToolCallContentBlock
            steps[toolIdx] = { ...tool, status: ToolCallStatus.COMPLETED, endTime: new Date().toISOString(), output }
        },
        failToolCall({ toolCallId }: FailToolCallParams): void {
            const toolIdx = steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && (block as ToolCallContentBlock).toolCallId === toolCallId)
            if (toolIdx === -1) {
                return
            }
            const tool = steps[toolIdx] as ToolCallContentBlock
            steps[toolIdx] = { ...tool, status: ToolCallStatus.COMPLETED, endTime: new Date().toISOString(), output: { status: ExecutionToolStatus.FAILED } }
        },
        hasTextContent(): boolean {
            return steps.some((step) => step.type === ContentBlockType.MARKDOWN && step.markdown.trim().length > 0)
        },
        build(): AgentResult {
            return { status, steps, structuredOutput, prompt }
        },
    }
}

function getToolMetadata({ toolName, baseTool, toolKeyToAgentTool }: GetToolMetadataParams): ToolCallContentBlock {
    const tool = toolKeyToAgentTool[toolName]
    if (isNil(tool)) {
        return { ...baseTool, toolCallType: ToolCallType.UNKNOWN, displayName: toolName }
    }

    switch (tool.type) {
        case AgentToolType.PIECE: {
            assertNotNullOrUndefined(tool.pieceMetadata, 'Piece metadata is required')
            return { ...baseTool, toolCallType: ToolCallType.PIECE, pieceName: tool.pieceMetadata.pieceName, pieceVersion: tool.pieceMetadata.pieceVersion, actionName: tool.pieceMetadata.actionName }
        }
        case AgentToolType.FLOW: {
            assertNotNullOrUndefined(tool.externalFlowId, 'Flow ID is required')
            return { ...baseTool, toolCallType: ToolCallType.FLOW, displayName: tool.toolName, externalFlowId: tool.externalFlowId }
        }
        case AgentToolType.MCP: {
            assertNotNullOrUndefined(tool.serverUrl, 'MCP server URL is required')
            return { ...baseTool, toolCallType: ToolCallType.MCP, displayName: toolName, serverUrl: tool.serverUrl }
        }
        case AgentToolType.KNOWLEDGE_BASE: {
            return { ...baseTool, toolCallType: ToolCallType.KNOWLEDGE_BASE, displayName: tool.sourceName, sourceType: tool.sourceType }
        }
    }
}

export type ToolKeyToAgentTool = Record<string, AgentTool>

export type AgentOutputBuilder = ReturnType<typeof agentOutputBuilder>

type FinishToolCallParams = {
    toolCallId: string
    output: Record<string, unknown>
}

type FailToolCallParams = {
    toolCallId: string
}

type StartToolCallParams = {
    toolName: string
    toolCallId: string
    input: Record<string, unknown>
}

type FinishParams = {
    message?: string
}

type GetToolMetadataParams = {
    toolName: string
    toolKeyToAgentTool: ToolKeyToAgentTool
    baseTool: ToolCallBase
}
