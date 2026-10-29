import { AIProviderName } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { aiProviderUtils } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import { boundContextForStep } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const SYSTEM_PROMPT = 'You are a helpful agent.'
const IN_TURN_BUDGET = aiProviderUtils.getMaxContextTokens({ provider: AIProviderName.ACTIVEPIECES }) * 0.6

describe('boundContextForStep', () => {
    it('keeps a long tool-heavy turn under the in-turn budget even when old tool outputs are small', () => {
        const log = fakeLog()
        const request: ModelMessage = { role: 'user', content: 'Build me a flow that syncs every Attio record to a table.' }
        const stepMessages = Array.from({ length: 150 }, (_, i) => toolRound({ index: i })).flat()

        const bounded = boundContextForStep({ baseMessages: [request], steps: [{ response: { messages: stepMessages } }], systemPrompt: SYSTEM_PROMPT, provider: AIProviderName.ACTIVEPIECES, log })

        const messages = bounded.messages ?? []
        expect(agentAiUtils.estimateTokenCount({ messages: [request, ...stepMessages], systemPromptLength: SYSTEM_PROMPT.length })).toBeGreaterThan(IN_TURN_BUDGET * 2)
        expect(messages).toHaveLength(stepMessages.length + 1)
        expect(agentAiUtils.estimateTokenCount({ messages, systemPromptLength: SYSTEM_PROMPT.length })).toBeLessThanOrEqual(IN_TURN_BUDGET)
        expect(messages[0]).toEqual(request)
        expect(messages.slice(-2)).toEqual(stepMessages.slice(-2))
    })

    it('logs the estimated tokens before and after shrinking', () => {
        const log = fakeLog()
        const stepMessages = Array.from({ length: 150 }, (_, i) => toolRound({ index: i })).flat()

        boundContextForStep({ baseMessages: [{ role: 'user', content: 'go' }], steps: [{ response: { messages: stepMessages } }], systemPrompt: SYSTEM_PROMPT, provider: AIProviderName.ACTIVEPIECES, log })

        const [fields] = log.info.mock.calls[0]
        expect(fields.context.estimatedTokensBefore).toBeGreaterThan(IN_TURN_BUDGET)
        expect(fields.context.estimatedTokensAfter).toBeLessThanOrEqual(IN_TURN_BUDGET)
    })

    it('leaves a turn under the threshold untouched so prompt caching stays warm', () => {
        const log = fakeLog()
        const stepMessages = toolRound({ index: 0 })

        expect(boundContextForStep({ baseMessages: [{ role: 'user', content: 'go' }], steps: [{ response: { messages: stepMessages } }], systemPrompt: SYSTEM_PROMPT, provider: AIProviderName.ACTIVEPIECES, log })).toEqual({})
        expect(log.info).not.toHaveBeenCalled()
    })
})

function toolRound({ index }: { index: number }): ModelMessage[] {
    const toolCallId = `call_${index}`
    const toolName = index % 3 === 0 ? 'ap_get_piece_props' : 'ap_run_code'
    return [
        {
            role: 'assistant',
            content: [
                { type: 'text', text: `Step ${index}: ${'reasoning about the next change. '.repeat(60)}` },
                { type: 'tool-call', toolCallId, toolName, input: { code: `export const code = async () => { ${'await doWork();'.repeat(400)} }` } },
            ],
        },
        {
            role: 'tool',
            content: [{ type: 'tool-result', toolCallId, toolName, output: { type: 'text', value: toolName === 'ap_get_piece_props' ? 'p'.repeat(3_000) : 'ok' } }],
        },
    ]
}

function fakeLog() {
    return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}
