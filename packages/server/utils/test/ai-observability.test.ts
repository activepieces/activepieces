import { ActivepiecesAiConsumerSource } from '@activepieces/core-utils'
import { createLogger } from 'evlog'
import { tool } from 'ai'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { agentAiUtils } from '../src/agent-ai-utils'
import { aiObservability } from '../src/ai-observability'
import { apVersionUtil } from '../src/ap-version'
import { wideEvent } from '../src/wide-event'

describe('aiObservability', () => {
    afterEach(() => {
        aiObservability.reset()
    })

    it('adds no PostHog integration when not on Cloud', () => {
        aiObservability.init({ enabled: false })

        expect(aiObservability.integration()).toBeUndefined()
        expect(agentAiUtils.buildTelemetry({ functionId: 'agent-turn' })).toEqual({})
    })

    it('reads the user, conversation and tenant from the job wide event', () => {
        aiObservability.init({ enabled: true })
        const logger = createLogger({ user: { id: 'user-1' }, conversation: { id: 'conversation-1' }, platform: { id: 'platform-1' }, project: { id: 'project-1' } })

        const { telemetry, runtimeContext } = wideEvent.run({ logger, fn: () => agentAiUtils.buildTelemetry({ functionId: 'agent-turn' }) })

        expect(telemetry?.integrations).toContain(aiObservability.integration())
        expect(runtimeContext).toEqual({
            distinctId: 'user-1',
            sessionId: 'conversation-1',
            groups: JSON.stringify({ platform: 'platform-1', project: 'project-1' }),
            version: apVersionUtil.getCurrentRelease(),
        })
    })

    it('reads the ids from billing when there is no wide event', () => {
        aiObservability.init({ enabled: true })

        const { runtimeContext } = agentAiUtils.buildTelemetry({
            functionId: 'agent-compaction',
            billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: null, conversationId: 'conversation-1', chat: { userId: 'user-1', turnIndex: 0, tier: 'smart' } },
        })

        expect(runtimeContext).toEqual({
            distinctId: 'user-1',
            sessionId: 'conversation-1',
            groups: JSON.stringify({ platform: 'platform-1' }),
            version: apVersionUtil.getCurrentRelease(),
        })
    })

    it('tags the turn with its run source, tier and fingerprint', () => {
        aiObservability.init({ enabled: true })

        const { runtimeContext } = agentAiUtils.buildTelemetry({
            functionId: 'agent-turn',
            turn: { runSource: 'CHAT', tierId: 'smart', tierModel: 'model-1', fingerprint: 'abc123' },
        })

        expect(runtimeContext).toMatchObject({ runSource: 'CHAT', tierId: 'smart', tierModel: 'model-1', fingerprint: 'abc123' })
    })
})

describe('aiObservability.turnFingerprintOf', () => {
    it('stays the same for the same prompt, tools and skills', async () => {
        const first = await aiObservability.turnFingerprintOf(fingerprintInput({ description: 'Lists flows' }))
        const second = await aiObservability.turnFingerprintOf(fingerprintInput({ description: 'Lists flows' }))

        expect(first).toBe(second)
    })

    it('changes when a tool description changes', async () => {
        const before = await aiObservability.turnFingerprintOf(fingerprintInput({ description: 'Lists flows' }))
        const after = await aiObservability.turnFingerprintOf(fingerprintInput({ description: 'Lists every flow in the project' }))

        expect(after).not.toBe(before)
    })

    it('changes when a tool input schema changes', async () => {
        const before = await aiObservability.turnFingerprintOf(fingerprintInput({ description: 'Lists flows' }))
        const after = await aiObservability.turnFingerprintOf({
            ...fingerprintInput({ description: 'Lists flows' }),
            tools: { ap_list_flows: tool({ description: 'Lists flows', inputSchema: z.object({ limit: z.number() }) }) },
        })

        expect(after).not.toBe(before)
    })

    it('changes when the prompt or a skill changes', async () => {
        const base = await aiObservability.turnFingerprintOf(fingerprintInput({ description: 'Lists flows' }))
        const newPrompt = await aiObservability.turnFingerprintOf({ ...fingerprintInput({ description: 'Lists flows' }), promptFingerprint: 'prompt-2' })
        const newSkill = await aiObservability.turnFingerprintOf({ ...fingerprintInput({ description: 'Lists flows' }), guides: { 'build-flow': 'Build it differently' } })

        expect(newPrompt).not.toBe(base)
        expect(newSkill).not.toBe(base)
    })

    it('ignores the order tools and skills come in', async () => {
        const listFlows = tool({ description: 'Lists flows', inputSchema: z.object({}) })
        const runFlow = tool({ description: 'Runs a flow', inputSchema: z.object({ flowId: z.string() }) })

        const first = await aiObservability.turnFingerprintOf({ promptFingerprint: 'prompt-1', tools: { ap_list_flows: listFlows, ap_run_flow: runFlow }, guides: { a: '1', b: '2' } })
        const second = await aiObservability.turnFingerprintOf({ promptFingerprint: 'prompt-1', tools: { ap_run_flow: runFlow, ap_list_flows: listFlows }, guides: { b: '2', a: '1' } })

        expect(first).toBe(second)
    })
})

function fingerprintInput({ description }: { description: string }): Parameters<typeof aiObservability.turnFingerprintOf>[0] {
    return {
        promptFingerprint: 'prompt-1',
        tools: { ap_list_flows: tool({ description, inputSchema: z.object({}) }) },
        guides: { 'build-flow': 'Build it' },
    }
}
