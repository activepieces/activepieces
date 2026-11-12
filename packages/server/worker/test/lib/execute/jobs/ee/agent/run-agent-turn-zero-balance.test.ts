import { AIProviderName } from '@activepieces/core-utils'
import { chatBilling } from '@activepieces/shared'
import { tool } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { creditLedger } from '../../../../../../src/lib/execute/jobs/ee/agent/credit-ledger'
import { runAgentTurn } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a free-plan chat turn that spends its balance down to zero', () => {
    it('stops a loop of free tool calls once the balance hits zero, instead of running until the token ceiling', async () => {
        const balance = freePlanBalance({ remaining: REMAINING_WHEN_TURN_STARTED })
        const model = reloadsTheSameSkill({ balance })

        const turn = await runFreePlanTurn({ model, balance })

        expect(balance.remaining).toBe(0)
        expect(model.doStreamCalls.length).toBeLessThan(10)
        expect(turn.creditsExhausted).toBe(true)
    })
})

async function runFreePlanTurn({ model, balance }: { model: MockLanguageModelV3, balance: FreePlanBalance }): ReturnType<typeof runAgentTurn> {
    const creditsLeftFor = creditLedger.create({
        creditsLeft: async (pendingCredits) => balance.remaining - pendingCredits,
        messageCredits: chatBilling.creditsForTurn({ provider: AIProviderName.ACTIVEPIECES, toolCalls: [] }).messageCredits,
    })
    return runAgentTurn({
        models: [{ model, provider: AIProviderName.ACTIVEPIECES, modelId: 'z-ai/glm-5.3', thinkingBudget: 0 }],
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'Turn it on' }],
        tools: { ap_add_step: tool({ description: 'add a step', inputSchema: z.object({ flowId: z.string() }), execute: async () => TOOL_RESULT }) },
        allToolNames: ['ap_add_step'],
        tier: { id: 'smart', thinkingBudget: 0, modelId: 'z-ai/glm-5.3' },
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        sinks: { drainStream: (result) => result.consumeStream() },
        creditsLeft: creditsLeftFor('main'),
        skills: { surface: 'CHAT', guides: { build_flow: '# Guide: Build an automation' } },
    })
}

function freePlanBalance({ remaining }: { remaining: number }): FreePlanBalance {
    const balance = {
        remaining,
        charge: (credits: number): void => {
            balance.remaining = Math.max(0, balance.remaining - credits)
        },
    }
    return balance
}

function reloadsTheSameSkill({ balance }: { balance: FreePlanBalance }): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async () => {
            calls++
            balance.charge(CREDITS_PER_MODEL_CALL[calls - 1] ?? TYPICAL_CREDITS_PER_MODEL_CALL)
            const usage = { inputTokens: { total: 3_907 + 45 * calls, noCache: 3_907 + 45 * calls, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 15, text: 15, reasoning: 0 } }
            return {
                stream: convertArrayToReadableStream(calls > SKILL_RELOADS_BEFORE_ANSWERING
                    ? [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'text-start' as const, id: 'answer' },
                        { type: 'text-delta' as const, id: 'answer', delta: 'I could not publish the flow yet.' },
                        { type: 'text-end' as const, id: 'answer' },
                        { type: 'finish' as const, finishReason: 'stop' as const, usage },
                    ]
                    : [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'tool-call' as const, toolCallId: `call-${calls}`, toolName: 'ap_load_skill', input: '{"skills":["flow_building"]}' },
                        { type: 'finish' as const, finishReason: 'tool-calls' as const, usage },
                    ]),
            }
        },
    })
}

const REMAINING_WHEN_TURN_STARTED = 5.4402204

const CREDITS_PER_MODEL_CALL = [0.385288, 4.932, 4.1944, 0.2713472, 1.757504, 1.780224]

const TYPICAL_CREDITS_PER_MODEL_CALL = 2

const SKILL_RELOADS_BEFORE_ANSWERING = 732

const TOOL_RESULT = { content: [{ type: 'text', text: 'ok' }] }

const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }

type FreePlanBalance = {
    remaining: number
    charge: (credits: number) => void
}
