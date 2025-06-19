import { isNil } from '../common'
import { ContentBlockType, RichContentBlock, ToolCallContentBlock } from '../todos/content'
import { agentbuiltInToolsNames, AgentTestResult } from './index'

export const agentOutputUtils = {
    findAgentResult(params: FindAgentResultParams): AgentTestResult {
        const result = getAgentCompletionOutput(params.content)
        return {
            todoId: params.todoId,
            output: !isNil(result) ? result : 'The agent was not able to complete the task',
            steps: params.content,
        }
    },
}

type FindAgentResultParams = {
    todoId: string
    content: RichContentBlock[]
}

function getAgentCompletionOutput(content: RichContentBlock[]): unknown {
    return content
        .filter((block): block is ToolCallContentBlock =>
            block.type === ContentBlockType.TOOL_CALL &&
            block.displayName === agentbuiltInToolsNames.markAsComplete,
        )
        .map(block => block.input)
        .at(0)
}
