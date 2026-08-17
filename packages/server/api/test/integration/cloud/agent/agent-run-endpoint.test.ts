import { AIProviderName, apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
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
    it('writes nothing before publishing, so an interrupted request cannot strand a conversation', async () => {
        const ctx = await contextThatCanRunAgents()
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-that-is-not-a-user',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: { instruction: 'send a summary email', flowRunId: apId(), waitpointId: apId() },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const { conversationId } = response.json()

        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: conversationId })
        expect(conversation).toBeNull()
    })

    it('ignores a project sent in the body and uses the one the engine token is scoped to', async () => {
        const ctx = await contextThatCanRunAgents()
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
            body: { instruction: 'do a thing', flowRunId: apId(), waitpointId: apId(), projectId: other.project.id },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().conversationId).toEqual(expect.any(String))
    })

    it('keeps flow-step runs out of the owner\'s chat list', async () => {
        const ctx = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-3',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: { instruction: 'do a thing', flowRunId: apId(), waitpointId: apId() },
        })

        const list = await ctx.post('/v1/agents/conversations', { title: 'a real chat' })
        expect([StatusCodes.OK, StatusCodes.CREATED]).toContain(list.statusCode)
        const listed = await ctx.get('/v1/agents/conversations')
        const sources = listed.json().data.map((c: { title: string | null }) => c.title)
        expect(sources).toEqual(['a real chat'])
    })

    it('refuses a signed-in user, because only a running flow may start one', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.post('/v1/agents/runs', {
            instruction: 'do a thing',
            flowRunId: apId(), waitpointId: apId(),
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
            body: { instruction: '', flowRunId: apId(), waitpointId: apId() },
        })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
    })

    it('refuses two tools sharing a name, so neither silently replaces the other', async () => {
        const ctx = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-dup',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: {
                instruction: 'do a thing',
                flowRunId: apId(),
                waitpointId: apId(),
                tools: [
                    { type: 'PIECE', toolName: 'shared_name', pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' } },
                    { type: 'FLOW', toolName: 'shared_name', externalFlowId: 'flow-1' },
                ],
            },
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('shared_name')
    })

    it('accepts the piece tools configured on the step', async () => {
        const ctx = await contextThatCanRunAgents()
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-6',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: {
                instruction: 'send the summary',
                flowRunId: apId(),
                waitpointId: apId(),
                tools: [{
                    type: 'PIECE',
                    toolName: 'send_email',
                    pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' },
                }],
            },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('refuses a tool named after one of the agent\'s own, so it cannot be shadowed', async () => {
        const ctx = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-7',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: {
                instruction: 'do a thing',
                flowRunId: apId(),
                waitpointId: apId(),
                structuredOutput: [{ displayName: 'summary', type: 'text' }],
                tools: [{
                    type: 'PIECE',
                    toolName: 'updateTaskStatus',
                    pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' },
                }],
            },
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('allows that name when the step has no output fields, since no completion tool is installed', async () => {
        const ctx = await contextThatCanRunAgents()
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-8',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: {
                instruction: 'do a thing',
                flowRunId: apId(),
                waitpointId: apId(),
                tools: [{
                    type: 'PIECE',
                    toolName: 'updateTaskStatus',
                    pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' },
                }],
            },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('rejects a waitpoint that is not an id, so nothing unbounded reaches the queue', async () => {
        const ctx = await createTestContext(app)
        const engineToken = await accessTokenManager(app.log).generateEngineToken({
            jobId: 'job-4',
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
        })

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: { instruction: 'do a thing', flowRunId: apId(), waitpointId: 'x'.repeat(5_000) },
        })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
    })
})

async function contextThatCanRunAgents(): Promise<TestContext> {
    const ctx = await createTestContext(app)
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
    return ctx
}
