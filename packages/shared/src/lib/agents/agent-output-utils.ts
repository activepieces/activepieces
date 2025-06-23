import { isNil } from '../common'
import { ContentBlockType, RichContentBlock, ToolCallContentBlock } from '../todos/content'
import { agentbuiltInToolsNames, AgentTaskStatus, AgentTestResult } from './index'

export const agentOutputUtils = {
    findAgentResult(params: FindAgentResultParams): AgentTestResult {
        const markAsComplete = params.content.find((block): block is ToolCallContentBlock =>
            block.type === ContentBlockType.TOOL_CALL &&
            block.name === agentbuiltInToolsNames.markAsComplete,
        )
    
        return {
            todoId: params.todoId,       
            output: markAsComplete?.input,
            status: !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
        }
    },
}

type FindAgentResultParams = {
    todoId: string
    content: RichContentBlock[]
}
