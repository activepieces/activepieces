import { AgentYieldStatus } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { createAgentSession, createAgentSessionRegistry } from '../../src/lib/ai/agent/agent-session'

function flushImmediate(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve))
}

describe('createAgentSession suspend/resume choreography', () => {
    it('batches piece-tool calls dispatched in one step into a single NEED_TOOLS yield', async () => {
        const session = createAgentSession({ agentRunId: 'run-1', abortController: new AbortController() })

        const yieldPromise = session.waitForYield()
        // model dispatches two piece-tools in the same step (both park)
        const tool1 = session.parkToolCall({ toolCallId: 'tc-1', toolName: 'gmail', input: { instruction: 'send' } })
        const tool2 = session.parkToolCall({ toolCallId: 'tc-2', toolName: 'slack', input: { instruction: 'post' } })

        const firstYield = await yieldPromise
        expect(firstYield.status).toBe(AgentYieldStatus.NEED_TOOLS)
        if (firstYield.status !== AgentYieldStatus.NEED_TOOLS) throw new Error('unreachable')
        expect(firstYield.toolCalls.map((t) => t.toolCallId)).toEqual(['tc-1', 'tc-2'])

        // continueAgent feeds both results back; parked callbacks resolve
        session.resolveToolResults([
            { toolCallId: 'tc-1', output: { status: 'SUCCESS', sent: true } },
            { toolCallId: 'tc-2', output: { status: 'SUCCESS', posted: true } },
        ])
        await expect(tool1).resolves.toEqual({ status: 'SUCCESS', sent: true })
        await expect(tool2).resolves.toEqual({ status: 'SUCCESS', posted: true })
    })

    it('resolves the next yield with DONE when the loop completes', async () => {
        const session = createAgentSession({ agentRunId: 'run-2', abortController: new AbortController() })
        const yieldPromise = session.waitForYield()
        session.complete({ status: 'COMPLETED', text: 'all done' })
        const result = await yieldPromise
        expect(result.status).toBe(AgentYieldStatus.DONE)
        if (result.status !== AgentYieldStatus.DONE) throw new Error('unreachable')
        expect(result.output).toEqual({ status: 'COMPLETED', text: 'all done' })
    })

    it('yields TIMEOUT and rejects parked tool calls on dispose', async () => {
        const onDispose = vi.fn()
        const session = createAgentSession({ agentRunId: 'run-3', abortController: new AbortController(), onDispose })

        const yieldPromise = session.waitForYield()
        const parked = session.parkToolCall({ toolCallId: 'tc-9', toolName: 'gmail', input: {} })
        await flushImmediate()
        await yieldPromise // drains the NEED_TOOLS yield

        const budgetYield = session.waitForYield()
        session.fail({ status: AgentYieldStatus.TIMEOUT, errorMessage: 'budget exhausted' })
        const result = await budgetYield
        expect(result.status).toBe(AgentYieldStatus.TIMEOUT)

        session.dispose()
        await expect(parked).rejects.toThrow('Agent session disposed')
        expect(onDispose).toHaveBeenCalledTimes(1)
    })

    it('buffers a settle that arrives with no parked waiter and delivers it on the next waitForYield', async () => {
        const session = createAgentSession({ agentRunId: 'run-4', abortController: new AbortController() })

        // Budget abort fires while the ENGINE is mid piece-tool: no waitForYield is registered
        // (the NEED_TOOLS yield was already consumed), so the TIMEOUT must be buffered — not dropped.
        session.fail({ status: AgentYieldStatus.TIMEOUT, errorMessage: 'budget exhausted' })

        // The next continueAgent check-in registers a waiter and must immediately receive it.
        const result = await session.waitForYield()
        expect(result.status).toBe(AgentYieldStatus.TIMEOUT)
        if (result.status !== AgentYieldStatus.TIMEOUT) throw new Error('unreachable')
        expect(result.errorMessage).toBe('budget exhausted')
    })

    it('settles a registered waiter with FAILED on dispose instead of leaving it hanging', async () => {
        const session = createAgentSession({ agentRunId: 'run-5', abortController: new AbortController() })
        const yieldPromise = session.waitForYield()
        session.dispose()
        const result = await yieldPromise
        expect(result.status).toBe(AgentYieldStatus.FAILED)
        if (result.status !== AgentYieldStatus.FAILED) throw new Error('unreachable')
        expect(result.errorMessage).toBe('Agent session disposed')
    })

    it('registry tracks sessions and disposeAll tears them down', async () => {
        const registry = createAgentSessionRegistry()
        const disposed: string[] = []
        const a = createAgentSession({ agentRunId: 'a', abortController: new AbortController(), onDispose: () => disposed.push('a') })
        const b = createAgentSession({ agentRunId: 'b', abortController: new AbortController(), onDispose: () => disposed.push('b') })
        registry.add(a)
        registry.add(b)
        expect(registry.get('a')).toBe(a)

        registry.disposeAll()
        expect(disposed.sort()).toEqual(['a', 'b'])
        expect(registry.get('a')).toBeUndefined()
    })
})
