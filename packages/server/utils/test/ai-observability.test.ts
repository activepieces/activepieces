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
        aiObservability.init({ enabled: false, projectToken: PROJECT_TOKEN })

        expect(aiObservability.integration()).toBeUndefined()
        expect(agentAiUtils.buildTelemetry({ functionId: 'agent-turn' })).toEqual({})
    })

    it('adds no PostHog integration without a project token', () => {
        aiObservability.init({ enabled: true, projectToken: null })

        expect(aiObservability.integration()).toBeUndefined()
        expect(agentAiUtils.buildTelemetry({ functionId: 'agent-turn' })).toEqual({})
    })

    it('follows a changed project token when a worker fetches its settings again', () => {
        aiObservability.init({ enabled: true, projectToken: PROJECT_TOKEN })
        const first = aiObservability.integration()

        aiObservability.init({ enabled: true, projectToken: PROJECT_TOKEN })
        expect(aiObservability.integration()).toBe(first)

        aiObservability.init({ enabled: true, projectToken: null })
        expect(aiObservability.integration()).toBeUndefined()

        aiObservability.init({ enabled: true, projectToken: 'phc_other' })
        expect(aiObservability.integration()).toBeDefined()
        expect(aiObservability.integration()).not.toBe(first)
    })

    it('reads the user, conversation and tenant from the job wide event', () => {
        aiObservability.init({ enabled: true, projectToken: PROJECT_TOKEN })
        const logger = createLogger({ user: { id: 'user-1' }, conversation: { id: 'conversation-1' }, platform: { id: 'platform-1' }, project: { id: 'project-1' } })

        const { telemetry, runtimeContext } = wideEvent.run({ logger, fn: () => agentAiUtils.buildTelemetry({ functionId: 'agent-turn' }) })

        expect(telemetry?.integrations).toContain(aiObservability.integration())
        expect(runtimeContext).toEqual({
            distinctId: 'user-1',
            sessionId: 'conversation-1',
            groups: JSON.stringify({ platform: 'platform-1', project: 'project-1' }),
            functionId: 'agent-turn',
        })
    })

    it('reads the ids from billing when there is no wide event', () => {
        aiObservability.init({ enabled: true, projectToken: PROJECT_TOKEN })

        const { runtimeContext } = agentAiUtils.buildTelemetry({
            functionId: 'agent-compaction',
            billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: null, conversationId: 'conversation-1', chat: { userId: 'user-1', turnIndex: 0, tier: 'smart' } },
        })

        expect(runtimeContext).toEqual({
            distinctId: 'user-1',
            sessionId: 'conversation-1',
            groups: JSON.stringify({ platform: 'platform-1' }),
            functionId: 'agent-compaction',
        })
    })

    it('tags the turn with its run source and tier from the wide event', () => {
        aiObservability.init({ enabled: true, projectToken: PROJECT_TOKEN })
        const logger = createLogger({ user: { id: 'user-1' }, agentRun: { source: 'CHAT', tierId: 'smart', tierModel: 'model-1' } })

        const { runtimeContext } = wideEvent.run({ logger, fn: () => agentAiUtils.buildTelemetry({ functionId: 'agent-turn' }) })

        expect(runtimeContext).toMatchObject({ runSource: 'CHAT', tierId: 'smart', tierModel: 'model-1' })
    })

    it('keeps the run labels from the wide event when billing names the ids', () => {
        aiObservability.init({ enabled: true, projectToken: PROJECT_TOKEN })
        const logger = createLogger({ agentRun: { source: 'CHAT', tierId: 'smart', tierModel: 'model-1' } })

        const { runtimeContext } = wideEvent.run({
            logger,
            fn: () => agentAiUtils.buildTelemetry({
                functionId: 'web-search',
                billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: null, conversationId: 'conversation-1', chat: { userId: 'user-1', turnIndex: 0, tier: 'smart' } },
            }),
        })

        expect(runtimeContext).toEqual({
            distinctId: 'user-1',
            sessionId: 'conversation-1',
            groups: JSON.stringify({ platform: 'platform-1' }),
            runSource: 'CHAT',
            tierId: 'smart',
            tierModel: 'model-1',
            functionId: 'web-search',
        })
    })
})

const PROJECT_TOKEN = 'phc_test'
