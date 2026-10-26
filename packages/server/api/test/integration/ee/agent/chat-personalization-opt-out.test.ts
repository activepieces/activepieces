import { apId } from '@activepieces/core-utils'
import { ChatPersonalizationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chatPersonalizationService } from '../../../../src/app/ee/agent/personalization/chat-personalization-service'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('clearing chat personalization', () => {
    it('hides the company cards and profile once the user clears them', async () => {
        const ctx = await createTestContext(app)
        await saveResearchedCompany(ctx)

        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, personalize: false })
        const view = await service().getEffectiveView({ platformId: ctx.platform.id, userId: ctx.user.id })

        expect(view.status).toBe(ChatPersonalizationStatus.SKIPPED)
        expect(view.useCases).toEqual([])
        expect(view.profile).toBeNull()
    })

    it('brings the company cards back when the user turns personalization on again', async () => {
        const ctx = await createTestContext(app)
        await saveResearchedCompany(ctx)
        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, personalize: false })

        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, personalize: true })
        const view = await service().getEffectiveView({ platformId: ctx.platform.id, userId: ctx.user.id })

        expect(view.useCases).toEqual(USE_CASES)
    })
})

function service() {
    return chatPersonalizationService(app.log)
}

async function saveResearchedCompany(ctx: TestContext): Promise<void> {
    await db.save('chat_personalization', {
        id: apId(),
        platformId: ctx.platform.id,
        userId: null,
        domain: 'acme.com',
        companyText: null,
        role: null,
        status: ChatPersonalizationStatus.READY,
        researchToken: null,
        profile: { companyName: 'Acme', displayName: 'Acme', website: 'acme.com', description: 'a logistics company', industry: 'Transport', userRole: null },
        useCases: USE_CASES,
    })
}

const USE_CASES = [{ title: 'Track shipments', description: 'Post late shipments to Slack' }]
