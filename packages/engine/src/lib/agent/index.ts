import { AgentRunParams } from '@activepieces/pieces-framework'
import { Experimental_Agent as Agent, hasToolCall, stepCountIs, StreamTextResult, tool, ToolSet } from 'ai'
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
    const agent = new Agent({
        model: params.model,
        system: params.systemPrompt,
        stopWhen: [
            stepCountIs(params.maxSteps),
            hasToolCall('markAsFinish'),
        ],
        experimental_output: params.experimental_output,
        toolChoice: {
            type: 'tool',
            toolName: 'markAsFinish',
        },
        tools,
    })

    const stream = agent.stream({
        prompt: params.prompt,
    })

    return stream
}