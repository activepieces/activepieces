import { AgentToolCall, AgentToolResult, AgentYield, AgentYieldStatus } from '@activepieces/shared'

/**
 * One in-flight agent run, holding the live (paused) `streamText` and bridging the worker's
 * suspend/resume protocol.
 *
 * The worker drives `streamText` whose piece-tool `execute` callbacks call `parkToolCall` — each
 * returns a promise that stays unresolved (parking the model loop) until the engine feeds the
 * result back via `continueAgent` → `resolveToolResults`. Piece-tool calls dispatched in the same
 * step are batched into one `NEED_TOOLS` yield; worker-native tools never park (they resolve
 * inline). Exactly one side is ever active: either the worker runs the model (engine parked on the
 * RPC ack) or the engine runs a piece-tool (model parked on the tool callback).
 *
 * The session MUST be disposed on every exit — DONE, FAILED, budget TIMEOUT, or sandbox death — so
 * `dispose` rejects any still-parked callbacks and tears down the abort wiring.
 */
export function createAgentSession({ agentRunId, abortController, onDispose }: CreateAgentSessionParams): AgentSession {
    const pendingResolvers = new Map<string, ToolCallResolver>()
    const disposeHooks: Array<() => void> = []
    let pendingBatch: AgentToolCall[] = []
    let flushHandle: ReturnType<typeof setImmediate> | undefined
    let currentYield: Deferred<AgentYield> | undefined
    let bufferedYield: AgentYield | undefined
    let disposed = false

    // A settle can arrive while no RPC is parked on `waitForYield` — e.g. the budget abort fires
    // while the ENGINE is mid piece-tool (decision #2's overshoot case). Buffer it so the next
    // `continueAgent` check-in receives the TIMEOUT/FAILED instead of hanging until the RPC timeout.
    function settleYield(value: AgentYield): void {
        const deferred = currentYield
        currentYield = undefined
        if (deferred) {
            deferred.resolve(value)
        }
        else {
            bufferedYield = value
        }
    }

    function flushBatch(): void {
        flushHandle = undefined
        if (pendingBatch.length === 0) {
            return
        }
        const toolCalls = pendingBatch
        pendingBatch = []
        settleYield({ status: AgentYieldStatus.NEED_TOOLS, agentRunId, toolCalls })
    }

    return {
        agentRunId,
        abortController,

        parkToolCall({ toolCallId, toolName, input }: AgentToolCall): Promise<unknown> {
            return new Promise<unknown>((resolve, reject) => {
                pendingResolvers.set(toolCallId, { resolve, reject })
                pendingBatch.push({ toolCallId, toolName, input })
                // Batch every piece-tool call the model dispatches in the same step into one yield.
                // setImmediate fires after the SDK has synchronously dispatched all of the step's
                // execute callbacks; if the SDK instead awaits them serially this degrades safely to
                // one tool per yield (still correct, just an extra round-trip).
                if (flushHandle === undefined) {
                    flushHandle = setImmediate(flushBatch)
                }
            })
        },

        waitForYield(): Promise<AgentYield> {
            if (bufferedYield !== undefined) {
                const settled = bufferedYield
                bufferedYield = undefined
                return Promise.resolve(settled)
            }
            const deferred = createDeferred<AgentYield>()
            currentYield = deferred
            return deferred.promise
        },

        resolveToolResults(toolResults: AgentToolResult[]): void {
            for (const { toolCallId, output } of toolResults) {
                const resolver = pendingResolvers.get(toolCallId)
                if (resolver) {
                    pendingResolvers.delete(toolCallId)
                    resolver.resolve(output)
                }
            }
        },

        addDisposeHook(hook: () => void): void {
            disposeHooks.push(hook)
        },

        complete(output: unknown): void {
            settleYield({ status: AgentYieldStatus.DONE, agentRunId, output })
        },

        fail({ status, errorMessage, partialOutput }: FailParams): void {
            settleYield({ status, agentRunId, errorMessage, partialOutput })
        },

        dispose(): void {
            if (disposed) {
                return
            }
            disposed = true
            if (flushHandle !== undefined) {
                clearImmediate(flushHandle)
                flushHandle = undefined
            }
            settleYield({ status: AgentYieldStatus.FAILED, agentRunId, errorMessage: 'Agent session disposed' })
            bufferedYield = undefined
            for (const resolver of pendingResolvers.values()) {
                resolver.reject(new Error('Agent session disposed'))
            }
            pendingResolvers.clear()
            pendingBatch = []
            for (const hook of disposeHooks) {
                hook()
            }
            disposeHooks.length = 0
            onDispose?.()
        },
    }
}

export function createAgentSessionRegistry(): AgentSessionRegistry {
    const sessions = new Map<string, AgentSession>()
    return {
        add(session: AgentSession): void {
            sessions.set(session.agentRunId, session)
        },
        get(agentRunId: string): AgentSession | undefined {
            return sessions.get(agentRunId)
        },
        remove(agentRunId: string): void {
            sessions.delete(agentRunId)
        },
        disposeAll(): void {
            for (const session of sessions.values()) {
                session.dispose()
            }
            sessions.clear()
        },
    }
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

type ToolCallResolver = {
    resolve: (output: unknown) => void
    reject: (reason: unknown) => void
}

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason: unknown) => void
}

type FailParams = {
    status: AgentYieldStatus.FAILED | AgentYieldStatus.TIMEOUT
    errorMessage: string
    partialOutput?: unknown
}

type CreateAgentSessionParams = {
    agentRunId: string
    abortController: AbortController
    onDispose?: () => void
}

export type AgentSession = {
    agentRunId: string
    abortController: AbortController
    parkToolCall(toolCall: AgentToolCall): Promise<unknown>
    waitForYield(): Promise<AgentYield>
    resolveToolResults(toolResults: AgentToolResult[]): void
    addDisposeHook(hook: () => void): void
    complete(output: unknown): void
    fail(params: FailParams): void
    dispose(): void
}

export type AgentSessionRegistry = {
    add(session: AgentSession): void
    get(agentRunId: string): AgentSession | undefined
    remove(agentRunId: string): void
    disposeAll(): void
}
