import { apId } from '@activepieces/core-utils'
import { ChatPersonalizationScope, ChatPersonalizationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { IsNull } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { chatPersonalizationService } from '../../../../src/app/ee/agent/personalization/chat-personalization-service'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockEnqueueResearchJob, mockGuardsAllowResearch } = vi.hoisted(() => ({
    mockEnqueueResearchJob: vi.fn().mockResolvedValue(undefined),
    mockGuardsAllowResearch: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../../../src/app/ee/agent/personalization/personalization-research', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../../../src/app/ee/agent/personalization/personalization-research')>()
    return {
        ...original,
        guardsAllowResearch: mockGuardsAllowResearch,
        enqueueResearchJob: mockEnqueueResearchJob,
    }
})

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

    it('ignores a research run that finishes after the user cleared personalization', async () => {
        const ctx = await createTestContext(app)
        await saveResearchedCompany(ctx)
        const researchToken = apId()
        await db.save('chat_personalization', {
            id: apId(),
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            domain: 'acme.com',
            companyText: null,
            role: null,
            status: ChatPersonalizationStatus.RESEARCHING,
            researchToken,
            profile: null,
            useCases: null,
        })
        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, personalize: false })

        await service().saveResult({ platformId: ctx.platform.id, userId: ctx.user.id, scope: ChatPersonalizationScope.USER, researchToken, status: 'READY', profile: PROFILE, useCases: USE_CASES })

        const userRow = await db.findOneByOrFail<{ status: string }>('chat_personalization', { platformId: ctx.platform.id, userId: ctx.user.id })
        expect(userRow.status).toBe(ChatPersonalizationStatus.SKIPPED)
    })

    it('ignores a company research run that finishes after the user cleared personalization', async () => {
        const ctx = await createTestContext(app)
        const researchToken = apId()
        await db.save('chat_personalization', {
            id: apId(),
            platformId: ctx.platform.id,
            userId: null,
            domain: 'acme.com',
            companyText: null,
            role: null,
            status: ChatPersonalizationStatus.RESEARCHING,
            researchToken,
            profile: null,
            useCases: null,
        })
        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, personalize: false })

        await service().saveResult({ platformId: ctx.platform.id, userId: ctx.user.id, scope: ChatPersonalizationScope.COMPANY, researchToken, status: 'READY', profile: RESEARCHED_PROFILE, useCases: RESEARCHED_USE_CASES })

        const userRow = await db.findOneByOrFail<{ status: string, useCases: unknown }>('chat_personalization', { platformId: ctx.platform.id, userId: ctx.user.id })
        const companyRow = await db.findOneByOrFail<{ status: string }>('chat_personalization', { platformId: ctx.platform.id, userId: IsNull() })
        expect(companyRow.status).toBe(ChatPersonalizationStatus.READY)
        expect(userRow.status).toBe(ChatPersonalizationStatus.SKIPPED)
        expect(userRow.useCases).toBeNull()
    })
})

describe('company research for the founding user', () => {
    it('gives the founding user the company cards when company research finishes', async () => {
        const ctx = await createTestContext(app)
        const researchToken = apId()
        await db.save('chat_personalization', {
            id: apId(),
            platformId: ctx.platform.id,
            userId: null,
            domain: 'acme.com',
            companyText: null,
            role: null,
            status: ChatPersonalizationStatus.RESEARCHING,
            researchToken,
            profile: null,
            useCases: null,
        })

        await service().saveResult({ platformId: ctx.platform.id, userId: ctx.user.id, scope: ChatPersonalizationScope.COMPANY, researchToken, status: 'READY', profile: RESEARCHED_PROFILE, useCases: RESEARCHED_USE_CASES })

        const userRow = await db.findOneByOrFail<{ status: string, useCases: unknown }>('chat_personalization', { platformId: ctx.platform.id, userId: ctx.user.id })
        expect(userRow.status).toBe(ChatPersonalizationStatus.READY)
        expect(userRow.useCases).toEqual(RESEARCHED_USE_CASES)
    })
})

describe('changing the role on finished personalization', () => {
    it('starts new research for the new role instead of keeping the old cards', async () => {
        const ctx = await createTestContext(app)
        await saveResearchedCompany(ctx)
        await saveReadyUserRow({ ctx, role: 'Sales' })

        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, role: 'Engineer', personalize: true })

        const userRow = await db.findOneByOrFail<{ role: string, status: string, researchToken: string | null }>('chat_personalization', { platformId: ctx.platform.id, userId: ctx.user.id })
        expect(userRow.role).toBe('Engineer')
        expect(userRow.status).toBe(ChatPersonalizationStatus.PENDING)
        expect(mockEnqueueResearchJob).toHaveBeenCalledWith(expect.objectContaining({ userId: ctx.user.id, role: 'Engineer', researchToken: userRow.researchToken }))
    })

    it('keeps the current cards when research cannot run, and retries the same role later', async () => {
        const ctx = await createTestContext(app)
        await saveResearchedCompany(ctx)
        await saveReadyUserRow({ ctx, role: 'Sales' })
        mockGuardsAllowResearch.mockResolvedValueOnce(false)

        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, role: 'Engineer', personalize: true })
        const blocked = await db.findOneByOrFail<{ role: string, status: string, useCases: unknown }>('chat_personalization', { platformId: ctx.platform.id, userId: ctx.user.id })
        expect(blocked).toMatchObject({ role: 'Sales', status: ChatPersonalizationStatus.READY, useCases: USE_CASES })

        await service().upsert({ platformId: ctx.platform.id, userId: ctx.user.id, role: 'Engineer', personalize: true })
        const retried = await db.findOneByOrFail<{ role: string, status: string }>('chat_personalization', { platformId: ctx.platform.id, userId: ctx.user.id })
        expect(retried).toMatchObject({ role: 'Engineer', status: ChatPersonalizationStatus.PENDING })
    })
})

function service() {
    return chatPersonalizationService(app.log)
}

async function saveReadyUserRow({ ctx, role }: { ctx: TestContext, role: string }): Promise<void> {
    await db.save('chat_personalization', {
        id: apId(),
        platformId: ctx.platform.id,
        userId: ctx.user.id,
        domain: 'acme.com',
        companyText: null,
        role,
        status: ChatPersonalizationStatus.READY,
        researchToken: null,
        profile: null,
        useCases: USE_CASES,
    })
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
        profile: PROFILE,
        useCases: USE_CASES,
    })
}

const PROFILE = { companyName: 'Acme', displayName: 'Acme', website: 'acme.com', description: 'a logistics company', industry: 'Transport', userRole: null }

const RESEARCHED_PROFILE = { companyName: 'Acme', displayName: 'Acme', website: 'acme.com', description: 'a logistics company', industry: 'Transport' }

const RESEARCHED_USE_CASES = [{ id: 'late-shipments', title: 'Track shipments', prompt: 'Post late shipments to Slack', imageId: 'answer-customers' }]

const USE_CASES = [{ title: 'Track shipments', description: 'Post late shipments to Slack' }]
