import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const RUNS_URL = '/api/v1/agents/runs'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/agents/runs', () => {
    it('creates a flow-step conversation owned by a real user, not the engine job', async () => {
        const ctx = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-that-is-not-a-user',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: { instruction: 'send a summary email', resumeUrl: 'https://example.com/resume/abc' },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const { conversationId } = response.json()

        const conversation = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversationId })
        expect(conversation.source).toBe('FLOW_STEP')
        expect(conversation.projectId).toBe(ctx.project.id)
        expect(conversation.userId).not.toBe('job-that-is-not-a-user')
    })

    it('ignores a project sent in the body and uses the one the engine token is scoped to', async () => {
        const ctx = await createTestContext(app)
        const other = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-1',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: { instruction: 'do a thing', resumeUrl: 'https://example.com/resume/abc', projectId: other.project.id },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const conversation = await agentHelpers.conversationRepo().findOneByOrFail({ id: response.json().conversationId })
        expect(conversation.projectId).toBe(ctx.project.id)
    })

    it('refuses a signed-in user, because only a running flow may start one', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.post('/v1/agents/runs', {
            instruction: 'do a thing',
            resumeUrl: 'https://example.com/resume/abc',
        })

        expect([StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN]).toContain(response.statusCode)
    })

    it('rejects a request with no instruction', async () => {
        const ctx = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-2',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: { instruction: '', resumeUrl: 'https://example.com/resume/abc' },
        })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
    })
})
