import { OPERATING_PRINCIPLES_BLOCK, runAgentTurn } from '@activepieces/core-agent-runtime'
import { tryCatchSync } from '@activepieces/core-utils'
import { AgentProfile, RunAgentParams, RunAgentResult } from '@activepieces/pieces-framework'
import { hasToolCall } from 'ai'

export const agentRunner = {
    async run({ model, provider, profile, system, prompt, tools, maxSteps, providerOptions, stopOnToolName, onChunk }: RunAgentParams): Promise<RunAgentResult> {
        const result = await runAgentTurn({
            model,
            provider,
            systemPrompt: composeSystemPrompt({ system, profile }),
            messages: [{ role: 'user', content: prompt }],
            tools,
            ...(providerOptions ? { providerOptions } : {}),
            log: agentStepLogger,
            maxSteps,
            ...(stopOnToolName ? { stopWhen: [hasToolCall(stopOnToolName)] } : {}),
            drainStream: async (stream, markVisibleOutput) => {
                for await (const chunk of stream.fullStream) {
                    // Deltas reach the step's output builder as they arrive, so a stream that dies
                    // after emitting some must not be retried — the retry would append a second
                    // copy of the text the user can already see.
                    if (chunk.type === 'text-delta' || chunk.type === 'tool-call') {
                        markVisibleOutput()
                    }
                    await onChunk(chunk)
                }
            },
        })

        return {
            streamError: result.streamError,
            truncatedAfterRetries: result.truncatedAfterRetries,
            budgetExceeded: result.budgetExceeded,
            continuations: result.continuations,
        }
    },
}

// A step written before profiles existed carries no `profile`, and must keep the exact system
// prompt it has always run with — so only an explicit UNIFIED opts into the shared principles.
function composeSystemPrompt({ system, profile }: { system: string, profile?: AgentProfile }): string {
    return profile === AgentProfile.UNIFIED ? `${system}\n\n${OPERATING_PRINCIPLES_BLOCK}` : system
}

// `console` IS the engine's logger — `worker-socket.ts` patches it to forward to the worker as run
// stdout/stderr, joining its args with a space. Fields therefore have to be serialized here or
// they reach the run log as "[object Object]"; Errors need unwrapping too, since JSON.stringify
// renders them as "{}" and would drop the message that makes the log worth reading.
function serializeFields(obj: Record<string, unknown>): string {
    const { data } = tryCatchSync(() => JSON.stringify(obj, (_key, value) =>
        value instanceof Error ? { message: value.message, stack: value.stack } : value,
    ))
    return data ?? ''
}

const agentStepLogger = {
    info: (obj: Record<string, unknown>, msg: string) => console.log(msg, serializeFields(obj)),
    warn: (obj: Record<string, unknown>, msg: string) => console.warn(msg, serializeFields(obj)),
    error: (obj: Record<string, unknown>, msg: string) => console.error(msg, serializeFields(obj)),
}
