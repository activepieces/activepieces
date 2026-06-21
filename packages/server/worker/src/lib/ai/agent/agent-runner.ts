import { inspect } from 'util'
import { AgentTaskStatus, AgentYieldStatus, isNil, TASK_COMPLETION_TOOL_NAME } from '@activepieces/shared'
import { hasToolCall, LanguageModel, stepCountIs, streamText, ToolSet } from 'ai'
import { Logger } from 'pino'
import { AgentOutputBuilder } from './agent-output-builder'
import { AgentSession } from './agent-session'

/**
 * The sink-agnostic agent loop. It runs `streamText` with a built `ToolSet` — the tools' `execute`
 * callbacks ARE the sink (piece tools park via the session and yield to the engine; worker-native
 * tools resolve inline), so this loop never knows where a tool runs. It streams incremental output
 * into the builder, emits one usage event on finish, and settles the session on every exit (DONE,
 * FAILED, or budget TIMEOUT via the abort signal). Fire-and-forget: yields are delivered through
 * the session, not by awaiting this function.
 */
export function startAgentLoop(params: StartAgentLoopParams): void {
    const { model, system, prompt, tools, maxSteps, providerOptions, session, outputBuilder, onFinish, onProgress, log } = params

    void (async (): Promise<void> => {
        try {
            const stream = streamText({
                model,
                system,
                prompt,
                tools,
                stopWhen: [stepCountIs(maxSteps), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
                abortSignal: session.abortController.signal,
                ...(providerOptions ? { providerOptions } : {}),
                onFinish,
            })

            for await (const chunk of stream.fullStream) {
                processChunk({ chunk, outputBuilder, log })
                onProgress(outputBuilder.build())
            }

            // The model can end without calling the completion tool (e.g. maxSteps exhausted). An
            // error-free run must not surface as IN_PROGRESS — but a completion-tool verdict
            // (COMPLETED or FAILED via success=false) always wins, so only upgrade IN_PROGRESS.
            if (outputBuilder.build().status === AgentTaskStatus.IN_PROGRESS) {
                outputBuilder.setStatus(AgentTaskStatus.COMPLETED)
            }
            session.complete(outputBuilder.build())
        }
        catch (error) {
            const aborted = session.abortController.signal.aborted
            const errorMessage = aborted ? 'Agent run exceeded the remaining flow budget' : `Agent run failed: ${inspect(error)}`
            outputBuilder.fail({ message: errorMessage })
            session.fail({
                status: aborted ? AgentYieldStatus.TIMEOUT : AgentYieldStatus.FAILED,
                errorMessage,
                partialOutput: outputBuilder.build(),
            })
        }
    })()
}

function processChunk({ chunk, outputBuilder, log }: ProcessChunkParams): void {
    try {
        switch (chunk.type) {
            case 'text-delta':
                outputBuilder.addMarkdown(chunk.text)
                break
            case 'reasoning-delta':
                if ('text' in chunk && typeof chunk.text === 'string') {
                    outputBuilder.addMarkdown(chunk.text)
                }
                break
            case 'tool-call':
                if (chunk.toolName === TASK_COMPLETION_TOOL_NAME) {
                    break
                }
                outputBuilder.startToolCall({
                    toolName: chunk.toolName,
                    toolCallId: chunk.toolCallId,
                    input: isRecord(chunk.input) ? chunk.input : {},
                })
                break
            case 'tool-result':
                if (chunk.toolName === TASK_COMPLETION_TOOL_NAME) {
                    break
                }
                outputBuilder.finishToolCall({
                    toolCallId: chunk.toolCallId,
                    output: isRecord(chunk.output) ? chunk.output : { output: chunk.output },
                })
                break
            case 'tool-error':
                outputBuilder.failToolCall({ toolCallId: chunk.toolCallId })
                break
            default:
                break
        }
    }
    catch (error) {
        log.warn({ err: error, chunkType: chunk.type }, '[agentRunner] Failed to process stream chunk')
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value)
}

export type OnAgentFinish = NonNullable<Parameters<typeof streamText>[0]['onFinish']>

type StartAgentLoopParams = {
    model: LanguageModel
    system: string
    prompt: string
    tools: ToolSet
    maxSteps: number
    providerOptions?: Parameters<typeof streamText>[0]['providerOptions']
    session: AgentSession
    outputBuilder: AgentOutputBuilder
    onFinish: OnAgentFinish
    onProgress: (output: unknown) => void
    log: Logger
}

type FullStreamChunk = ReturnType<typeof streamText>['fullStream'] extends AsyncIterable<infer C> ? C : never

type ProcessChunkParams = {
    chunk: FullStreamChunk
    outputBuilder: AgentOutputBuilder
    log: Logger
}
