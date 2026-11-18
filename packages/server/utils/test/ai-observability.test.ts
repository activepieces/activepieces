import { ActivepiecesAiConsumerSource } from '@activepieces/core-utils'
import { createLogger } from 'evlog'
import { tool, ToolSet } from 'ai'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { agentAiUtils } from '../src/agent-ai-utils'
import { aiObservability } from '../src/ai-observability'
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
        })
    })

    it('tags the turn with its run source and tier from the wide event, and its fingerprint', () => {
        aiObservability.init({ enabled: true })
        const logger = createLogger({ user: { id: 'user-1' }, agentRun: { source: 'CHAT', tierId: 'smart', tierModel: 'model-1' } })

        const { runtimeContext } = wideEvent.run({ logger, fn: () => agentAiUtils.buildTelemetry({ functionId: 'agent-turn', fingerprint: 'abc123' }) })

        expect(runtimeContext).toMatchObject({ runSource: 'CHAT', tierId: 'smart', tierModel: 'model-1', fingerprint: 'abc123' })
    })
})

describe('aiObservability.turnFingerprintOf', () => {
    afterEach(() => {
        aiObservability.reset()
    })

    it('stays the same for the same prompt and tools', async () => {
        const first = await turnFingerprint(fingerprintInput({ description: 'Lists flows' }))
        const second = await turnFingerprint(fingerprintInput({ description: 'Lists flows' }))

        expect(first).toBe(second)
    })

    it('changes when a tool description changes', async () => {
        const before = await turnFingerprint(fingerprintInput({ description: 'Lists flows' }))
        const after = await turnFingerprint(fingerprintInput({ description: 'Lists every flow in the project' }))

        expect(after).not.toBe(before)
    })

    it('changes when a tool input schema changes', async () => {
        const before = await turnFingerprint(fingerprintInput({ description: 'Lists flows' }))
        const after = await turnFingerprint({
            ...fingerprintInput({ description: 'Lists flows' }),
            tools: { ap_list_flows: tool({ description: 'Lists flows', inputSchema: z.object({ limit: z.number() }) }) },
        })

        expect(after).not.toBe(before)
    })

    it('changes when the prompt or a skill guide changes', async () => {
        const base = await turnFingerprint(fingerprintInput({ description: 'Lists flows' }))
        const newGuide = aiObservability.promptFingerprintOf({ templates: { system: 'You help', guides: { 'build-flow': 'Build it differently' } } })
        const newPrompt = await turnFingerprint({ ...fingerprintInput({ description: 'Lists flows' }), promptFingerprint: newGuide })

        expect(newPrompt).not.toBe(base)
    })

    it('ignores the order tools come in', async () => {
        const listFlows = tool({ description: 'Lists flows', inputSchema: z.object({}) })
        const runFlow = tool({ description: 'Runs a flow', inputSchema: z.object({ flowId: z.string() }) })

        const first = await turnFingerprint({ promptFingerprint: 'prompt-1', tools: { ap_list_flows: listFlows, ap_run_flow: runFlow } })
        const second = await turnFingerprint({ promptFingerprint: 'prompt-1', tools: { ap_run_flow: runFlow, ap_list_flows: listFlows } })

        expect(first).toBe(second)
    })

    it('is skipped when tracing is off', async () => {
        const fingerprint = await aiObservability.turnFingerprintOf({ tools: fingerprintInput({ description: 'Lists flows' }).tools })

        expect(fingerprint).toBeUndefined()
    })
})

function turnFingerprint({ promptFingerprint, tools }: FingerprintInput): Promise<string | undefined> {
    aiObservability.init({ enabled: true })
    const logger = createLogger({ agentRun: { promptFingerprint } })
    return wideEvent.run({ logger, fn: () => aiObservability.turnFingerprintOf({ tools }) })
}

function fingerprintInput({ description }: { description: string }): FingerprintInput {
    return {
        promptFingerprint: aiObservability.promptFingerprintOf({ templates: { system: 'You help', guides: { 'build-flow': 'Build it' } } }),
        tools: { ap_list_flows: tool({ description, inputSchema: z.object({}) }) },
    }
}

type FingerprintInput = { promptFingerprint: string, tools: ToolSet }
