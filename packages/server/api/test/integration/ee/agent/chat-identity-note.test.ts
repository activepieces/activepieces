import { apId } from '@activepieces/core-utils'
import { ChatPersonalizationStatus, PlatformRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chatPersonalizationService } from '../../../../src/app/ee/agent/personalization/chat-personalization-service'
import { agentUserIdentity } from '../../../../src/app/ee/agent/prompt/agent-user-identity'
import { db } from '../../../helpers/db'
import { mockBasicUser } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const PROFILE = {
    companyName: 'Acme',
    displayName: 'Acme',
    website: 'acme.com',
    description: 'a logistics company',
    industry: 'Transport',
    userRole: 'Warehouse Manager',
}

async function savePersonalization({ platformId, userId, role, status, profile }: {
    platformId: string
    userId: string | null
    role: string | null
    status: ChatPersonalizationStatus
    profile: typeof PROFILE | null
}) {
    await db.save('chat_personalization', {
        id: apId(),
        platformId,
        userId,
        domain: 'acme.com',
        companyText: null,
        role,
        status,
        researchToken: null,
        profile,
        useCases: profile ? [{ title: 'a', description: 'b' }] : null,
    })
}

async function noteFor(ctx: TestContext): Promise<string> {
    const identity = await chatPersonalizationService(app.log).getIdentityEnrichment({
        platformId: ctx.platform.id,
        userId: ctx.user.id,
    })
    return agentUserIdentity.buildNote({
        firstName: 'Dana',
        lastName: 'Okwu',
        email: 'dana@acme.com',
        platformName: 'Acme Automate',
        identity,
    })
}

describe('what the agent is told about the person it is talking to', () => {
    it('carries the role even when the company was never researched', async () => {
        const ctx = await createTestContext(app)
        await savePersonalization({ platformId: ctx.platform.id, userId: null, role: null, status: ChatPersonalizationStatus.SKIPPED, profile: null })
        await savePersonalization({ platformId: ctx.platform.id, userId: ctx.user.id, role: 'Operations Lead', status: ChatPersonalizationStatus.SKIPPED, profile: null })

        const note = await noteFor(ctx)

        expect(note).toContain('Operations Lead')
        expect(note).toContain('the company is likely')
        expect(note).not.toContain('a logistics company')
    })

    it('replaces the domain guess with the researched company once it lands, keeping the role', async () => {
        const ctx = await createTestContext(app)
        await savePersonalization({ platformId: ctx.platform.id, userId: null, role: null, status: ChatPersonalizationStatus.READY, profile: PROFILE })
        await savePersonalization({ platformId: ctx.platform.id, userId: ctx.user.id, role: 'Operations Lead', status: ChatPersonalizationStatus.SKIPPED, profile: null })

        const note = await noteFor(ctx)

        expect(note).toContain('a logistics company')
        expect(note).toContain('Operations Lead')
        expect(note).not.toContain('the company is likely')
    })

    it('never attributes a teammate\'s role, or the one the research guessed, to the caller', async () => {
        const ctx = await createTestContext(app)
        await savePersonalization({ platformId: ctx.platform.id, userId: null, role: null, status: ChatPersonalizationStatus.READY, profile: PROFILE })
        const { mockUser: teammate } = await mockBasicUser({ user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER } })
        await savePersonalization({ platformId: ctx.platform.id, userId: teammate.id, role: 'Night Shift Lead', status: ChatPersonalizationStatus.READY, profile: null })
        await savePersonalization({ platformId: ctx.platform.id, userId: ctx.user.id, role: 'Operations Lead', status: ChatPersonalizationStatus.SKIPPED, profile: null })

        const note = await noteFor(ctx)

        expect(note).toContain('Operations Lead')
        expect(note).not.toContain('Night Shift Lead')
        expect(note).not.toContain('Warehouse Manager')
    })

    it('says nothing about a role for someone who never answered', async () => {
        const ctx = await createTestContext(app)
        await savePersonalization({ platformId: ctx.platform.id, userId: null, role: null, status: ChatPersonalizationStatus.READY, profile: PROFILE })

        const note = await noteFor(ctx)

        expect(note).not.toContain('Their own role is')
        expect(note).toContain('a logistics company')
    })
})
