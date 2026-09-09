import { AIProviderName, apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
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

async function contextThatCanRunAgents(): Promise<TestContext> {
    const ctx = await createTestContext(app)
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
    return ctx
}

async function engineTokenFor(ctx: TestContext, jobId: string): Promise<string> {
    return accessTokenManager(app.log).generateEngineToken({
        jobId,
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
    })
}

describe('community edition: POST /v1/agents/runs', () => {
    it('starts an agent step configured with its own tools, the only way a community install can run one', async () => {
        const ctx = await contextThatCanRunAgents()
        const engineToken = await engineTokenFor(ctx, 'ce-inline-run')

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
        expect(response.json().conversationId).toEqual(expect.any(String))
    })

    it('still refuses a signed-in user, because only a running flow may start one', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.post('/v1/agents/runs', {
            instruction: 'do a thing',
            flowRunId: apId(),
            waitpointId: apId(),
        })

        expect([StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN]).toContain(response.statusCode)
    })

    it('starts a step that names the provider and model it was configured with', async () => {
        const ctx = await createTestContext(app)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const engineToken = await engineTokenFor(ctx, 'ce-explicit-provider')

        const response = await app.inject({
            method: 'POST',
            url: RUNS_URL,
            headers: { authorization: `Bearer ${engineToken}` },
            body: {
                instruction: 'summarise the thread',
                flowRunId: apId(),
                waitpointId: apId(),
                provider: AIProviderName.OPENAI,
                modelName: 'gpt-4o',
            },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})
