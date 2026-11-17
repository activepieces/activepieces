import { ActivepiecesAiConsumerSource } from '@activepieces/core-utils'
import { createLogger } from 'evlog'
import { afterEach, describe, expect, it } from 'vitest'
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
})
