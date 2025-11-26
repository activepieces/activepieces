import { AgentRunParams } from '@activepieces/pieces-framework';
import { Experimental_Agent as Agent, stepCountIs, StreamTextResult, ToolSet } from 'ai';

export async function runAgent(params: AgentRunParams): Promise<StreamTextResult<ToolSet, unknown>> {
    const agent = new Agent({
        model: params.model,
        system: params.systemPrompt,
        stopWhen: stepCountIs(params.maxSteps),
        experimental_output: params.experimental_output
    });

    const stream = agent.stream({
        prompt: params.prompt
    });

    return stream
}