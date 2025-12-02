import { AgentResult, AgentStepBlock, AgentTaskStatus, AgentTool, assertNotNullOrUndefined, ContentBlockType, isNil, MarkdownContentBlock, ToolCallContentBlock, ToolCallStatus } from "@activepieces/shared"
import { agentCommon } from "../common"

export const agentOutputBuilder = (prompt: string) => {
    let status: AgentTaskStatus = AgentTaskStatus.IN_PROGRESS
    const steps: AgentStepBlock[] = []
    let structuredOutput: Record<string, unknown> | undefined = undefined

    return {
        fail({ message }: FinishParams) {
            if (!isNil(message)) {
                this.addMarkdown(message)
            }
            status = AgentTaskStatus.FAILED
        },
        setStatus(_status: AgentTaskStatus) {
            status = _status
        },
        setStructuredOutput(output: Record<string, unknown>) {
            structuredOutput = output
        },
        addMarkdown(markdown: string) {
            if (steps.length === 0 || steps[steps.length - 1].type !== ContentBlockType.MARKDOWN) {
                steps.push({
                    type: ContentBlockType.MARKDOWN,
                    markdown: '',
                })
            }
            (steps[steps.length - 1] as MarkdownContentBlock).markdown += markdown
        },
        startToolCall({ toolName, toolCallId, input, agentTools }: StartToolCallParams) {
            const metadata = agentCommon.getToolMetadata({
                toolName,
                baseTool: {
                    toolName,
                    toolCallId,
                    type: ContentBlockType.TOOL_CALL,
                    status: ToolCallStatus.IN_PROGRESS,
                    input,
                    output: undefined,
                    startTime: new Date().toISOString(),
                },
                tools: agentTools,
            })
            steps.push(metadata)
        },
        finishToolCall({ toolCallId, output }: FinishToolCallParams) {
            const toolIdx = steps.findIndex(
                (block) =>
                    block.type === ContentBlockType.TOOL_CALL &&
                    (block as ToolCallContentBlock).toolCallId === toolCallId
            )
            const tool = steps[toolIdx] as ToolCallContentBlock
            assertNotNullOrUndefined(tool, 'Last block must be a tool call')
            steps[toolIdx] = {
                ...tool,
                status: ToolCallStatus.COMPLETED,
                endTime: new Date().toISOString(),
                output,
            }
        },
        build(): AgentResult {
            return {
                status,
                steps,
                structuredOutput,
                prompt,
            }
        }
    }
}

type FinishToolCallParams = {
    toolCallId: string
    output: Record<string, unknown>
}

type StartToolCallParams = {
    toolName: string
    toolCallId: string
    input: Record<string, unknown>
    agentTools: AgentTool[]
}

type FinishParams = {
    message?: string
}