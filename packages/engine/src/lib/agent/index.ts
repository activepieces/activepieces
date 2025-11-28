import { AgentRunParams } from '@activepieces/pieces-framework'
import { streamText, hasToolCall, stepCountIs, StreamTextResult, tool, ToolSet } from 'ai'
import { markAsFinishSchema } from './tools-schema'

export const tools =  {
    markAsFinish: tool({
        description: 'Signals that the final goal is reached.',
        inputSchema: markAsFinishSchema,
        execute: ({ success }) => {
            return { success }
        },
    }),
} as ToolSet

export async function runAgent(params: AgentRunParams): Promise<StreamTextResult<ToolSet, unknown>> {
    const stream = streamText({
        model: params.model,
        prompt: params.prompt,
        system: params.systemPrompt,
        stopWhen: [
            stepCountIs(params.maxSteps),
            hasToolCall('markAsFinish'),
        ],
        experimental_output: params.experimental_output,
        tools,
    })

    return stream
}