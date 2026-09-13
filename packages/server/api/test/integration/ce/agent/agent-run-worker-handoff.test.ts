import { AIProviderName, apId } from '@activepieces/core-utils'
import { AgentRunSource } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
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

async function startFlowStepRun(ctx: TestContext, jobId: string): Promise<string> {
    const engineToken = await accessTokenManager(app.log).generateEngineToken({
        jobId,
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
    })
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
    return response.json().conversationId
}

describe('community edition: the worker picking up an agent step', () => {
    it('is handed a provider and a model, so the run does not stall on its first call', async () => {
        const ctx = await createTestContext(app)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const conversationId = await startFlowStepRun(ctx, 'ce-handoff')

        const config = await agentRpcHandlers(app.log).getAgentConfig({
            conversationId,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            projectId: ctx.project.id,
            userMessage: 'summarise the thread',
            modelName: 'gpt-4o',
            provider: AIProviderName.OPENAI,
            source: AgentRunSource.FLOW_STEP,
        })

        expect(config.provider).toBe(AIProviderName.OPENAI)
        expect(config.modelId).toBe('gpt-4o')
        expect(config.systemPrompt.length).toBeGreaterThan(0)
    })

    it('is told the saved-agent surface is unavailable, so the step cannot reach agent tools', async () => {
        const ctx = await createTestContext(app)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const conversationId = await startFlowStepRun(ctx, 'ce-handoff-surface')

        const config = await agentRpcHandlers(app.log).getAgentConfig({
            conversationId,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            projectId: ctx.project.id,
            userMessage: 'summarise the thread',
            modelName: 'gpt-4o',
            provider: AIProviderName.OPENAI,
            source: AgentRunSource.FLOW_STEP,
        })

        expect(config.agentsAvailable).toBe(false)
    })
})
