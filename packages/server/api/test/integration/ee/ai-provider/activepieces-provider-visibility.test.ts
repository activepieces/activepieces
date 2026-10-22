import { AIProviderName } from '@activepieces/core-utils'
import { SelfServeTrialDates } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { selfServeTrialUtils } from '../../../../src/app/ee/platform/platform-plan/self-serve-trial-utils'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
    process.env.AP_OPENROUTER_PROVISION_KEY = 'test-provision-key'
})

afterAll(async () => {
    delete process.env.AP_OPENROUTER_PROVISION_KEY
    await teardownTestEnvironment()
})

async function visibleProviders({ embeddingEnabled, trial, planWrittenAt }: VisibleProvidersParams) {
    const ctx = await createTestContext(app!, { plan: { embeddingEnabled } })
    if (trial !== undefined) {
        await selfServeTrialUtils.cacheTrialDates({ platformId: ctx.platform.id, dates: trial })
    }
    if (planWrittenAt !== undefined) {
        await databaseConnection().query('UPDATE "platform_plan" SET "updated" = $1 WHERE "platformId" = $2', [planWrittenAt, ctx.platform.id])
    }
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES, enabledForChat: false })
    const listed = await aiProviderService(app!.log).listConfigs(ctx.platform.id)
    const chat = await aiProviderService(app!.log).getChatProvider({ platformId: ctx.platform.id, scope: { type: 'platform' } })
    return { listed: listed.map((row) => row.provider), chat: chat?.provider ?? null }
}

function trialEnding({ days }: { days: number }): SelfServeTrialDates {
    return { startedAt: dayjs().subtract(7 - days, 'day').toISOString(), endsAt: dayjs().add(days, 'day').toISOString() }
}

describe('Activepieces AI provider visibility', () => {
    it('keeps the provider on a plan without Embedding', async () => {
        const { listed, chat } = await visibleProviders({ embeddingEnabled: false })

        expect(listed).toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBe(AIProviderName.ACTIVEPIECES)
    })

    it('hides the provider when the plan includes Embedding and no self-serve trial runs', async () => {
        const { listed, chat } = await visibleProviders({ embeddingEnabled: true, trial: null })

        expect(listed).not.toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBeNull()
    })

    it('shows the provider while a self-serve trial runs, even though the trial grants Embedding', async () => {
        const { listed, chat } = await visibleProviders({ embeddingEnabled: true, trial: trialEnding({ days: 3 }) })

        expect(listed).toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBe(AIProviderName.ACTIVEPIECES)
    })

    it('keeps the provider after the trial ends while the plan still carries the trial\'s Embedding', async () => {
        const { listed, chat } = await visibleProviders({
            embeddingEnabled: true,
            trial: trialEnding({ days: -1 }),
            planWrittenAt: dayjs().subtract(2, 'day').toISOString(),
        })

        expect(listed).toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBe(AIProviderName.ACTIVEPIECES)
    })

    it('hides the provider once the plan is written after the trial ended and still includes Embedding', async () => {
        const { listed, chat } = await visibleProviders({ embeddingEnabled: true, trial: trialEnding({ days: -1 }) })

        expect(listed).not.toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBeNull()
    })

    it('hides the provider when the trial cache is empty and the platform has no Autumn customer', async () => {
        const { listed, chat } = await visibleProviders({ embeddingEnabled: true })

        expect(listed).not.toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBeNull()
    })
})

type VisibleProvidersParams = {
    embeddingEnabled: boolean
    trial?: SelfServeTrialDates | null
    planWrittenAt?: string
}
