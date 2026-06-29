import { z } from 'zod'
import { ProjectSession } from '../session'
import { runTool } from './shared'

/**
 * Anthropic Messages API provider (`client.messages.create({ tools })`). Maps the session's
 * meta-tools to the Messages tool shape and gives you an `executeToolUse` that runs a
 * `tool_use` block and returns the `tool_result` block to send back.
 */
export function toAnthropicTools(session: ProjectSession): AnthropicToolkit {
    const tools = session.tools()
    return {
        tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: z.toJSONSchema(z.object(tool.inputSchema)),
        })),
        async executeToolUse(block) {
            const content = await runTool(tools, block.name, block.input)
            return { type: 'tool_result', tool_use_id: block.id, content }
        },
    }
}

type AnthropicToolkit = {
    tools: Array<{ name: string, description: string, input_schema: Record<string, unknown> }>
    executeToolUse: (block: AnthropicToolUse) => Promise<AnthropicToolResult>
}

type AnthropicToolUse = {
    id: string
    name: string
    input: unknown
}

type AnthropicToolResult = {
    type: 'tool_result'
    tool_use_id: string
    content: string
}
