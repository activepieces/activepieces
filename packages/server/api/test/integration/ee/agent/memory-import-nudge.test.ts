import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('memory import nudge', () => {
    it('is offered once, on the first chat of a user with empty memory', async () => {
        const ctx = await chatContext()
        await startChat(ctx)

        expect(await nudgeEligible(ctx)).toBe(true)
        expect(await claimNudge(ctx)).toBe(true)
        expect(await nudgeEligible(ctx)).toBe(false)
    })

    it('lets only one page claim it when two pages saw it as eligible', async () => {
        const ctx = await chatContext()
        await startChat(ctx)

        const claims = await Promise.all([claimNudge(ctx), claimNudge(ctx)])

        expect(claims.filter(Boolean)).toHaveLength(1)
    })

    it('is not offered before the first chat or once there is a second one', async () => {
        const ctx = await chatContext()
        expect(await nudgeEligible(ctx)).toBe(false)

        await startChat(ctx)
        await startChat(ctx)
        expect(await nudgeEligible(ctx)).toBe(false)
    })

    it('is not offered or claimable when the user already has memory', async () => {
        const ctx = await chatContext()
        await ctx.post('/v1/agents/memory', { memories: { next: ['Works in sales'], base: [] } })
        await startChat(ctx)

        expect(await nudgeEligible(ctx)).toBe(false)
        expect(await claimNudge(ctx)).toBe(false)
    })
})

async function chatContext(): Promise<TestContext> {
    return createTestContext(app, { plan: { chatEnabled: true } })
}

async function startChat(ctx: TestContext): Promise<void> {
    const created = await ctx.post('/v1/agents/conversations', { title: 'Hello' })
    expect(created.statusCode).toBe(StatusCodes.CREATED)
}

async function nudgeEligible(ctx: TestContext): Promise<boolean> {
    const response = await ctx.get(NUDGE_URL)
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json().eligible
}

async function claimNudge(ctx: TestContext): Promise<boolean> {
    const response = await ctx.post(`${NUDGE_URL}/claim`)
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json().claimed
}

const NUDGE_URL = '/v1/agents/memory/import-nudge'
