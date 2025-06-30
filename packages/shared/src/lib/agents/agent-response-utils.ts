import { isNil } from '../common'
import { AgentTaskStatus, AgentTestResult, ContentBlockType, RichContentBlock, ToolCallContentBlock } from './response'
import { agentbuiltInToolsNames } from './index'

export const agentOutputUtils = {
    formatAgentResponse(params: Params): AgentTestResult {
        const markAsComplete = params.content.find(isMarkAsComplete) as ToolCallContentBlock | undefined
        const text = params.content.filter(block => !isMarkAsComplete(block)).map((block) => {
            switch (block.type) {
                case ContentBlockType.MARKDOWN:
                    return block.markdown
                case ContentBlockType.TOOL_CALL:
                    return ''
            }
        }).join('\n')

        const tools = params.content.filter(block => block.type === ContentBlockType.TOOL_CALL).map((block) => {
            return {
                displayName: block.displayName,
                logoUrl: block.logoUrl,
                status: block.status,
                startTime: block.startTime,
                endTime: block.endTime,
                input: block.input,
                output: block.output,
            }
        })
        return {
            todoId: params.todoId,
            status: !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
            output: markAsComplete?.input,
            text,
            tools,
            content: params.content,
        }
    },
}

function isMarkAsComplete(block: RichContentBlock): boolean {
    return block.type === ContentBlockType.TOOL_CALL && block.name === agentbuiltInToolsNames.markAsComplete
}

type Params = {
    todoId: string
    content: RichContentBlock[]
}
