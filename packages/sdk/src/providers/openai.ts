import { z } from 'zod'
import { ProjectSession } from '../session'
import { runTool } from './shared'

/**
 * OpenAI Chat Completions provider. Maps the session's meta-tools to the function-tool
 * shape and gives you an `executeToolCall` that runs a tool_call and returns the
 * `role: 'tool'` message to append to the conversation.
 */
export function toOpenAITools(session: ProjectSession): OpenAIToolkit {
    const tools = session.tools()
    return {
        tools: tools.map((tool) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: z.toJSONSchema(z.object(tool.inputSchema)),
            },
        })),
        async executeToolCall(toolCall) {
            const content = await runTool(tools, toolCall.function.name, toolCall.function.arguments)
            return { role: 'tool', tool_call_id: toolCall.id, content }
        },
    }
}

type OpenAIToolkit = {
    tools: Array<{
        type: 'function'
        function: { name: string, description: string, parameters: Record<string, unknown> }
    }>
    executeToolCall: (toolCall: OpenAIToolCall) => Promise<OpenAIToolMessage>
}

type OpenAIToolCall = {
    id: string
    function: { name: string, arguments: string }
}

type OpenAIToolMessage = {
    role: 'tool'
    tool_call_id: string
    content: string
}
